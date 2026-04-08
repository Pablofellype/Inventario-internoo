import { settings } from "../config/settings.js";
import { State } from "../core/state.js";
import { UI } from "../modules/ui.js";
import { Cache } from "./cache.js";
import { EpiParser } from "./epi_parser.js";

export const Api = {
  // =========================================================
  // 1. CARREGAMENTO INICIAL
  // =========================================================
  async preCarregarTudo() {
    console.log("🚀 Iniciando download completo...");

    await this.carregarColaboradores();

    const catalogoMap = new Map();
    const isSetorProdutos = (cat) =>
      cat === "EPI_UNIFORME" || cat.startsWith("DML_");

    const setores = Object.keys(settings.mapeamento).filter(
      (key) => key !== "COLABORADORES"
    );

    const promessas = setores.map(async (cat) => {
      try {
        const gid = settings.mapeamento[cat];
        const url = `${settings.baseDados}&gid=${gid}&t=${Date.now()}`;

        const res = await fetch(url);
        const csv = await res.text();

        let dadosProcessados;

        // --- SELEÇÃO INTELIGENTE DO PROCESSADOR ---
        if (cat === "SOLICITACAO_EPI_UNIFORME") {
          // Usa a lógica nova da barra |
          dadosProcessados = EpiParser.parse(csv);
        } else if (cat === "PEDIDOS_LOG") {
          dadosProcessados = this.processarCSVPedidos(csv);
        } else {
          dadosProcessados = this.processarCSV(csv);
        }

        await Cache.salvar(cat, dadosProcessados);

        if (isSetorProdutos(cat)) {
          dadosProcessados.forEach((item) => {
            if (!item || !item.root) return;
            const key = item.root;
            if (!catalogoMap.has(key)) {
              catalogoMap.set(key, {
                root: item.root,
                f: item.f || "",
                vars: [],
              });
            }
            const target = catalogoMap.get(key);
            if (!target.f && item.f) target.f = item.f;
            const existing = new Set(
              target.vars.map((v) => `${v.label}|${v.code}`)
            );
            (item.vars || []).forEach((v) => {
              const k = `${v.label}|${v.code}`;
              if (!existing.has(k)) {
                target.vars.push({ label: v.label, code: v.code });
                existing.add(k);
              }
            });
          });
        }
      } catch (erro) {
        console.warn(`⚠️ Erro ao baixar ${cat}:`, erro);
      }
    });

    await Promise.all(promessas);
    State.catalogoProdutos = Array.from(catalogoMap.values());

    // Cruzar códigos reais do EPI_UNIFORME com SOLICITACAO_EPI_UNIFORME
    try {
      const epiReal = await Cache.carregar("EPI_UNIFORME");
      const solicitacao = await Cache.carregar("SOLICITACAO_EPI_UNIFORME");
      if (epiReal && solicitacao) {
        // Normaliza labels removendo prefixos como "Nº", "N.", "Nº ", "Opção", etc.
        const normLabel = (s) => String(s || "").toUpperCase().trim()
          .replace(/^(N[º°]\.?\s*|N\.\s*|OPCAO\s*\d*\s*[\):]*\s*|OPÇÃO\s*\d*\s*[\):]*\s*)/gi, "")
          .replace(/\s+/g, " ").trim();

        const codMap = new Map();
        epiReal.forEach(item => {
          if (!item || !item.root) return;
          const key = item.root.toUpperCase().trim();
          const mainCode = (item.vars && item.vars.length === 1) ? item.vars[0].code : "";
          const subCodes = new Map();
          if (item.vars) {
            item.vars.forEach(v => {
              if (v.label && v.code) {
                subCodes.set(normLabel(v.label), v.code);
              }
            });
          }
          codMap.set(key, { mainCode, subCodes });
        });

        let atualizado = false;
        solicitacao.forEach(item => {
          if (!item || !item.root) return;
          const ref = codMap.get(item.root.toUpperCase().trim());
          if (!ref) return;
          item.vars.forEach(v => {
            // Só substituir se o código atual parece ser gerado automaticamente (padrão NOME-LABEL)
            const codigoAtual = String(v.code || "");
            const rootHifen = item.root.toUpperCase().replace(/\s+/g, "-");
            const pareceGerado = codigoAtual.includes(rootHifen);
            if (!pareceGerado) return; // Já tem um código real, não sobrescrever

            const labelKey = normLabel(v.label);
            if (ref.subCodes.has(labelKey)) {
              v.code = ref.subCodes.get(labelKey);
              atualizado = true;
            } else if (ref.mainCode && item.vars.length === 1) {
              v.code = ref.mainCode;
              atualizado = true;
            }
          });
        });
        if (atualizado) {
          await Cache.salvar("SOLICITACAO_EPI_UNIFORME", solicitacao);
        }
      }
    } catch (e) {
      console.warn("Aviso: não foi possível cruzar códigos EPI:", e);
    }

    console.log("🏁 Site carregado!");
  },

  // =========================================================
  // 2. COLABORADORES
  // =========================================================
  async carregarColaboradores() {
    try {
      const gid = settings.mapeamento["COLABORADORES"];
      if (!gid) return;
      const url = `${settings.baseDados}&gid=${gid}&t=${Date.now()}`;
      const res = await fetch(url);
      const csv = await res.text();
      const linhas = csv.split(/\r?\n/).filter((l) => l.trim());
      const lista = linhas
        .slice(1)
        .map((linha) => {
          const col = linha
            .split(
              /,(?=(?:(?:[^"]*"){2})*[^"]*$)|;(?=(?:(?:[^"]*"){2})*[^"]*$)/
            )
            .map((c) => c.replace(/^["']|["']$/g, "").trim());
          return {
            matricula: col[0],
            nome: col[1],
            equipe: col[2] || "DIURNO",
            imagem: col[3] || "",
          };
        })
        .filter((c) => c.nome && c.matricula);
      State.colaboradores = lista;
    } catch (e) {
      console.error("Erro colaboradores:", e);
      State.colaboradores = [];
    }
  },

  // =========================================================
  // 3. ENVIO DE PEDIDO (ATUALIZADO - ANTI-TRAVAMENTO 🚀)
  // =========================================================
  async enviarPedidoPlanilha(dadosPedido) {
    if (!settings.urlApiEnvio) return false;

    try {
      // Cria uma "corrida": O envio vs Um cronômetro de 2 segundos
      const envio = fetch(settings.urlApiEnvio, {
        method: "POST",
        mode: "no-cors", // Modo cego (não espera resposta detalhada)
        body: JSON.stringify(dadosPedido),
      });

      // Cronômetro de segurança
      const cronometro = new Promise((resolve) =>
        setTimeout(() => resolve("tempo_esgotado"), 2000)
      );

      // Quem terminar primeiro, ganha. Se o Google demorar, o cronômetro libera o site.
      await Promise.race([envio, cronometro]);

      // Assumimos sucesso sempre para não prender o usuário na tela "Enviando..."
      return true;
    } catch (e) {
      console.error("Erro ou Timeout no envio:", e);
      return true; // Retorna true mesmo com erro de rede para liberar a UI
    }
  },

  // =========================================================
  // 3.1. ATUALIZAR STATUS (NOVO 🆕)
  // =========================================================
  async atualizarStatus(id, novoStatus, codigoSap = "") {
    if (!settings.urlApiEnvio) return false;

    const payload = {
      acao: "atualizarStatus", // Define que é uma atualização e não um novo pedido
      id: id,
      status: novoStatus,
      codigoSap,
    };

    try {
      // Disparo Cego (Fire and Forget)
      const envio = fetch(settings.urlApiEnvio, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      const cronometro = new Promise((resolve) =>
        setTimeout(() => resolve("timeout"), 2000)
      );
      await Promise.race([envio, cronometro]);

      return true;
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
      return false;
    }
  },

  // =========================================================
  // 3.1.1. ATUALIZAR ITENS (Marcadores de Aprovação)
  // =========================================================
  async atualizarItens(id, novosItens) {
    if (!settings.urlApiEnvio) return false;
    try {
      const envio = fetch(settings.urlApiEnvio, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ acao: "atualizarItens", id, itens: novosItens }),
      });
      const cronometro = new Promise((resolve) => setTimeout(() => resolve("timeout"), 2000));
      await Promise.race([envio, cronometro]);
      return true;
    } catch (e) {
      console.error("Erro ao atualizar itens:", e);
      return false;
    }
  },

  // =========================================================
  // 3.2. BUSCAR HISTÓRICO (NOVO - UNIFICADO 🆕)
  // =========================================================
  async buscarHistoricoUnificado(matricula) {
    if (!settings.urlApiEnvio) return [];

    try {
      console.log("🔍 Buscando histórico unificado para:", matricula);

      // Removemos 'no-cors' aqui porque PRECISAMOS ler a resposta (JSON)
      const response = await fetch(settings.urlApiEnvio, {
        method: "POST",
        redirect: "follow", // Garante que segue o redirecionamento do Google
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // Evita Preflight CORS (OPTIONS)
        },
        body: JSON.stringify({
          acao: "buscarHistorico",
          matricula: String(matricula),
        }),
      });

      const dados = await response.json();
      console.log("📦 Dados recebidos:", dados);

      if (dados.result === "success" && Array.isArray(dados.historico)) {
        // TRADUTOR: Converte os nomes que vêm do Google para os nomes do Site
        return dados.historico.map((p) => ({
          id: p.id,
          dt: this.formatarDataISO(p.data), // Formata a data bonita
          mat: p.matricula,
          nome: p.nome,
          equ: p.equipe,
          opc: p.tipo,
          status: p.status,
          sap: p.codigoSap || "",
          local: p.local || "",
          its: p.itens,
          dataObj: new Date(p.data),
        }));
      }
      return [];
    } catch (e) {
      console.error("Erro ao buscar histórico unificado:", e);
      return [];
    }
  },

  // =========================================================
  // 3.3. CONTENÇÃO LATERAL (ATUALIZADO COM QUANTIDADE) 🆕
  // =========================================================
  async lerContencaoLateral() {
    if (!settings.urlApiEnvio) return [];

    try {
      const response = await fetch(settings.urlApiEnvio, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ acao: "lerContencaoLateral" }),
      });

      const dados = await response.json();
      if (dados.result === "success") {
        return dados.itens || [];
      }
      return [];
    } catch (e) {
      console.error("Erro ao ler contenção lateral:", e);
      return [];
    }
  },

  async atualizarAlertaContencao(material, tamanho, alerta) {
    if (!settings.urlApiEnvio) return { success: false };
    try {
      const response = await fetch(settings.urlApiEnvio, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          acao: "atualizarAlertaContencao",
          material,
          tamanho,
          alerta,
        }),
      });
      const dados = await response.json();
      return { success: dados.result === "success", msg: dados.msg };
    } catch (e) {
      console.error("Erro ao atualizar alerta:", e);
      return { success: false, msg: "Erro de conexão" };
    }
  },

  // AGORA ACEITA QUANTIDADE (Padrão = 1)
  // Se quantidade for negativa (ex: -1), ele SOMA no estoque (Desfazer)
  async baixarEstoqueLateral(material, tamanho, quantidade = 1) {
    if (!settings.urlApiEnvio) return { success: false };

    try {
      const response = await fetch(settings.urlApiEnvio, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          acao: "baixarEstoqueLateral",
          material: material,
          tamanho: tamanho,
          quantidade: quantidade, // Envia a quantidade exata
        }),
      });

      const dados = await response.json();
      return {
        success: dados.result === "success",
        novaQtd: dados.novaQtd,
        alerta: dados.alerta,
        msg: dados.msg,
      };
    } catch (e) {
      console.error("Erro ao baixar estoque lateral:", e);
      return { success: false, msg: "Erro de conexão" };
    }
  },

  async adicionarOuAtualizarContencao(payload) {
    if (!settings.urlApiEnvio) return { success: false };

    try {
      const response = await fetch(settings.urlApiEnvio, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          acao: "adicionarOuAtualizarContencao",
          material: payload.material,
          tamanho: payload.tamanho || "",
          foto: payload.foto || "",
          quantidade: payload.quantidade,
          forcarExistente: payload.forcarExistente === true,
        }),
      });

      const dados = await response.json();
      return {
        success: dados.result === "success",
        action: dados.action,
        novaQtd: dados.novaQtd,
        msg: dados.msg,
      };
    } catch (e) {
      console.error("Erro ao adicionar/atualizar contencao:", e);
      return { success: false, msg: "Erro de conexÃ£o" };
    }
  },

  // Auxiliar para formatar data ISO (que vem do Google Script) para BR
  formatarDataISO(isoDate) {
    if (!isoDate) return "---";
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleString("pt-BR");
  },

  // =========================================================
  // 4. SINCRONIZAR ESTOQUE (PRODUTOS)
  // =========================================================
  async sincronizarEstoque() {
    const loader = document.getElementById("carregando");
    const grid = document.getElementById("gradeAtivos");
    if (loader) loader.classList.remove("hidden");
    if (grid) grid.innerHTML = "";
    try {
      const dadosCache = await Cache.carregar(State.categoriaAtual);
      if (dadosCache) {
        State.ativos = dadosCache;
        UI.renderizarEstoque();
      }

      if (navigator.onLine) {
        const gid = settings.mapeamento[State.categoriaAtual];
        const url = `${settings.baseDados}&gid=${gid}&t=${Date.now()}`;
        const res = await fetch(url);
        const csv = await res.text();

        // --- SELEÇÃO INTELIGENTE AQUI TAMBÉM ---
        if (State.categoriaAtual === "SOLICITACAO_EPI_UNIFORME") {
          State.ativos = EpiParser.parse(csv);
        } else {
          State.ativos = this.processarCSV(csv);
        }

        Cache.salvar(State.categoriaAtual, State.ativos);
        UI.renderizarEstoque();
      }
    } catch (err) {
      console.warn("Cache mantido.");
    } finally {
      if (loader) loader.classList.add("hidden");
    }
  },

  // =========================================================
  // 5. SINCRONIZAR PEDIDOS (MONITOR)
  // =========================================================
  async sincronizarPedidos(tudo = false) {
    const loader = document.getElementById("carregando");
    const grid = document.getElementById("gradeAtivos");
    const isMonitor = State.categoriaAtual === "PEDIDOS_LOG";
    if (loader && isMonitor) loader.classList.remove("hidden");
    if (grid) grid.innerHTML = "";
    try {
      const dadosCache = await Cache.carregar("PEDIDOS_LOG");
      if (dadosCache) {
        State.pedidos = dadosCache;
        if (isMonitor) UI.renderizarPedidos(tudo);
      }
      if (navigator.onLine) {
        const gid = settings.mapeamento["PEDIDOS_LOG"];
        const url = `${settings.baseDados}&gid=${gid}&t=${Date.now()}`;
        const res = await fetch(url);
        const csv = await res.text();
        State.pedidos = this.processarCSVPedidos(csv);
        Cache.salvar("PEDIDOS_LOG", State.pedidos);
        if (isMonitor) UI.renderizarPedidos(tudo);
      }
    } catch (err) {
    } finally {
      if (loader) loader.classList.add("hidden");
    }
  },

  // =========================================================
  // 6. WIDGET HOME
  // =========================================================
  async atualizarWidgetHome() {
    const widget = document.getElementById("widgetUltimosPedidos");
    if (!widget) return;
    if (State.pedidos.length === 0) {
      const cache = await Cache.carregar("PEDIDOS_LOG");
      if (cache) State.pedidos = cache;
    }
    if (State.pedidos.length === 0 && navigator.onLine) {
      try {
        const gid = settings.mapeamento["PEDIDOS_LOG"];
        const url = `${settings.baseDados}&gid=${gid}&t=${Date.now()}`;
        const res = await fetch(url);
        const csv = await res.text();
        State.pedidos = this.processarCSVPedidos(csv);
        Cache.salvar("PEDIDOS_LOG", State.pedidos);
      } catch (e) {}
    }
    const ultimos = State.pedidos.slice(0, 5);
    if (ultimos.length === 0) {
      widget.innerHTML =
        '<p class="text-xs text-gray-400">Nenhum pedido recente.</p>';
      return;
    }
    widget.innerHTML = ultimos
      .map((p) => {
        const hora = p.dt.split(" ")[1]?.substring(0, 5) || "??:??";
        const nomeCurto = p.nome.split(" ")[0];
        let itemMostrar = p.opc;
        if (p.its && p.its.length > 2) {
          const parts = p.its.split("|");
          if (parts[0]) itemMostrar = parts[0].split(":")[1] || parts[0];
        }
        if (itemMostrar.length > 20)
          itemMostrar = itemMostrar.substring(0, 18) + "...";
        return `<div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2 last:mb-0"><div class="flex items-center gap-2 overflow-hidden"><div class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div><p class="text-[10px] font-bold uppercase text-zinc-700 truncate">${nomeCurto} <span class="text-gray-300 mx-1">|</span> ${itemMostrar}</p></div><span class="text-[9px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100 whitespace-nowrap ml-2">${hora}</span></div>`;
      })
      .join("");
    this.atualizarWidgetCriticos();
  },

  async atualizarWidgetCriticos() {
    const widget = document.getElementById("widgetContencaoCritica");
    if (!widget) return;
    try {
      const itens = await this.lerContencaoLateral();
      UI.renderizarCriticosContencao(itens);
    } catch (e) {}
  },

  // =========================================================
  // 7. PARSERS (PROCESSADORES DE CSV)
  // =========================================================
  processarCSV(texto) {
    const lines = texto.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const head = lines[0].split(sep).map((h) =>
      h
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
    );
    const iSub = head.indexOf("SUB_CODIGOS");
    return Array.from(
      lines
        .slice(1)
        .reduce((acc, row) => {
          const cols = row
            .split(new RegExp(`${sep}(?=(?:(?:[^"]*"){2})*[^"]*$)`))
            .map((c) => c.replace(/^["']|["']$/g, "").trim());
          const obj = {
            n: cols[head.indexOf("NOME")],
            c: cols[head.indexOf("CODIGO")],
            f: cols[head.indexOf("FOTO")],
            sub: cols[iSub] || "",
          };
          if (!obj.n) return acc;
          const root = obj.n
            .split(/ T\.| N\.| Nº| TAM| P | M | G | GG| EXGG| EG/i)[0]
            .trim()
            .toUpperCase();
          const varL = obj.n.replace(root, "").trim() || "Unidade";
          let rootFinal = root;
          let varLFinal = varL;
          const matchTam = String(obj.n || "").match(/\b(3[0-9]|4[0-9]|50)\b/);
          if (matchTam) {
            rootFinal = String(obj.n || "")
              .split(matchTam[0])[0]
              .trim()
              .toUpperCase();
            varLFinal =
              String(obj.n || "").replace(rootFinal, "").trim() || matchTam[0];
          }
          if (!acc.has(rootFinal))
            acc.set(rootFinal, {
              root: rootFinal,
              f: obj.f,
              sub: obj.sub,
              vars: [],
            });
          acc.get(rootFinal).vars.push({ label: varLFinal, code: obj.c });

          if (obj.sub && String(obj.sub).includes("|")) {
            const parsed = String(obj.sub)
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => {
                let label = s;
                let code = "";
                if (s.includes(":")) {
                  const parts = s.split(":");
                  label = parts[0].trim();
                  code = parts.slice(1).join(":").trim();
                } else if (s.includes("-")) {
                  const parts = s.split("-");
                  label = parts[0].trim();
                  code = parts.slice(1).join("-").trim();
                } else if (s.includes("=")) {
                  const parts = s.split("=");
                  label = parts[0].trim();
                  code = parts.slice(1).join("=").trim();
                }
                return { label, code };
              })
              .filter((v) => v.label);

            if (parsed.length > 0) {
              acc.get(rootFinal).vars = parsed;
            }
          }
          return acc;
        }, new Map())
        .values()
    );
  },

  processarCSVPedidos(texto) {
    const lines = texto.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map((h) => h.trim().toUpperCase());

    // Mapeamento Dinâmico de Colunas
    const iID = headers.findIndex(
      (h) => h.includes("ID") || h.includes("CODIGO")
    ); // Coluna ID
    const iDT = headers.findIndex(
      (h) => h.includes("CARIMBO") || h.includes("DATA")
    );
    const iMAT = headers.findIndex((h) => h.includes("MATRICULA"));
    const iNOM = headers.findIndex((h) => h.includes("NOME"));
    const iEQU = headers.findIndex(
      (h) => h.includes("EQUIPE") || h.includes("SETOR")
    );
    const iTIPO = headers.findIndex(
      (h) => h.includes("TIPO") || h.includes("OPCAO")
    ); // Coluna TIPO
    const iSTATUS = headers.findIndex(
      (h) => h.includes("STATUS") || h.includes("SITUACAO")
    ); // Coluna STATUS
    const iSAP = headers.findIndex(
      (h) => h.includes("SAP") || h.includes("CODIGO SAP")
    );
    const iLOCAL = headers.findIndex(
      (h) => h.includes("LOCAL")
    );

    return lines
      .slice(1)
      .map((row) => {
        const cols = row
          .split(new RegExp(`${sep}(?=(?:(?:[^"]*"){2})*[^"]*$)`))
          .map((c) => c.replace(/^["']|["']$/g, "").trim());

        // Monta a string de itens (pegando colunas que não são cabeçalhos padrão)
        const its = [];
        cols.forEach((v, i) => {
          if (
            v &&
            v !== "" &&
            ![iID, iDT, iMAT, iNOM, iEQU, iTIPO, iSTATUS, iSAP, iLOCAL].includes(i)
          ) {
            // Evita pegar colunas de controle como "LOCAL" se estiver vazia
            if (headers[i] === "ITENS" || headers[i].includes("SOLICITADOS")) {
              its.push(v);
            } else if (!headers[i].includes("LOCAL")) {
              // Fallback para colunas extras
              its.push(`${headers[i]}: ${v}`);
            }
          }
        });

        return {
          id: cols[iID] || "", // ID ÚNICO
          dt: cols[iDT] || "---",
          mat: cols[iMAT] || "SEM ID",
          nome: cols[iNOM] || "---",
          equ: cols[iEQU] || "---",
          opc: cols[iTIPO] || "Material",
          status: cols[iSTATUS] || "AGUARDANDO LIDERANÇA", // STATUS NOVO
          sap: iSAP >= 0 ? cols[iSAP] : "",
          local: iLOCAL >= 0 ? cols[iLOCAL] || "" : "",
          its: its.join(" | ") || cols[headers.indexOf("ITENS")] || "",
          dataObj: this.converterData(cols[iDT]),
        };
      })
      .sort((a, b) => b.dataObj - a.dataObj);
  },

  converterData(s) {
    if (!s) return new Date(0);
    const p = s.split(" ");
    if (p[0].includes("/")) {
      const d = p[0].split("/");
      return new Date(`${d[2]}-${d[1]}-${d[0]}T${p[1] || "00:00:00"}`);
    }
    return new Date(s);
  },
};
