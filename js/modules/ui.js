import { State } from "../core/state.js";
import { settings } from "../config/settings.js";
import Auth from "../core/auth.js";
import { Api } from "../services/api.js";

export const UI = {
  // Cache local para a busca interna
  dadosContencao: [],
  // Estado do modo de abastecimento (False = Retirar, True = Adicionar)
  modoAbastecimento: false,
  // Scroll da lista de selecao de itens (contencao)
  contencaoListaScroll: 0,

  // =========================================================
  // 0. DML DINÂMICO — estilos e render dos cards do admin
  // =========================================================
  _dmlStyleAdmin: {
    DML_COMERCIAL: { label: "Comercial",  icon: "store" },
    DML_CCB:       { label: "CCB",        icon: "building" },
    DML_ESTOQUE:   { label: "Estoque",    icon: "package" },
    DML_OFICINA:   { label: "Oficina",    icon: "wrench" },
    DML_INDUSTRIA: { label: "Industria",  icon: "factory" },
    DML_VESTIARIO: { label: "Vestiario",  icon: "shirt" },
  },
  _estiloDmlAdmin(id) {
    if (this._dmlStyleAdmin[id]) return this._dmlStyleAdmin[id];
    const sufixo = String(id || "").replace(/^DML_/, "").replace(/_/g, " ").toLowerCase();
    const label = sufixo.replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, icon: "layers" };
  },
  renderizarCardsDmlAdmin() {
    const grid = document.getElementById("gridSetores");
    if (!grid) return;
    const dmls = (State.dmlsDisponiveis && State.dmlsDisponiveis.length)
      ? State.dmlsDisponiveis
      : Object.keys(this._dmlStyleAdmin);

    // Remove botões DML antigos (mantém apenas o primeiro card estático — EPI_UNIFORME)
    Array.from(grid.querySelectorAll("[data-dml-dinamico]")).forEach((el) => el.remove());

    const html = dmls.map((id) => {
      const e = this._estiloDmlAdmin(id);
      const nomeCompleto = `DML ${e.label}`;
      return `
        <button data-dml-dinamico="${id}" onclick="Sistema.selecionarSetor('${id}', '${nomeCompleto.replace(/'/g, "\\'")}')" class="bg-white border border-zinc-100 p-5 md:p-7 rounded-xl text-left group cursor-pointer hover:border-red-200 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
          <i data-lucide="${e.icon}" class="w-6 h-6 text-zinc-300 group-hover:text-red-500 mb-4 transition-colors"></i>
          <h3 class="text-xs md:text-sm font-black leading-tight uppercase text-zinc-900">${e.label}</h3>
        </button>`;
    }).join("");

    grid.insertAdjacentHTML("beforeend", html);
    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================
  // 1. INICIALIZAÇÃO (LISTENERS)
  // =========================================================
  init() {
    const buscaPedidos = document.getElementById("inputBuscaPedidos");
    if (buscaPedidos) {
      buscaPedidos.addEventListener("input", (e) => {
        this.renderizarPedidos(true, e.target.value);
      });
    }

    const buscaEstoque = document.getElementById("inputBuscaEstoque");
    if (buscaEstoque) {
      buscaEstoque.addEventListener("input", (e) => {
        const termo = e.target.value.toUpperCase();
        const filtrados = State.ativos.filter((item) =>
          item.root.includes(termo)
        );
        this.renderizarEstoque(filtrados);
      });
    }
  },

  // =========================================================
  // 2. RENDERIZAÇÃO DE ESTOQUE (PRODUTOS)
  // =========================================================
  renderizarEstoque(filtrados = null) {
    const container = document.getElementById("gradeAtivos");
    const dados = filtrados || State.ativos;

    container.innerHTML = "";

    if (dados.length === 0) {
      document.getElementById("vazio").classList.remove("hidden");
      return;
    }
    document.getElementById("vazio").classList.add("hidden");

    dados.forEach((item) => {
      const card = document.createElement("div");
      // Design mais limpo e arredondado
      card.className =
        "card-operacional rounded-[2.5rem] p-6 flex flex-col animate-entrada-suave bg-white shadow-lg text-left text-zinc-900 overflow-hidden";

      let rows = "";
      if (item.vars.length <= 1) {
        const v = item.vars[0] || { label: "Unidade", code: "" };
        rows = `
                <div class="border-b border-gray-50 last:border-0 py-4 flex items-center justify-between text-zinc-900 gap-3">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none text-left truncate">${
                      v.label
                    }</span>
                    <button onclick="Sistema.copiarCodigo('${
                      v.code || ""
                    }')" class="px-3 py-2 bg-gray-100 rounded-xl font-black text-[10px] text-zinc-700 border-none cursor-pointer hover:bg-zinc-900 hover:text-white transition-all uppercase shadow-sm tracking-widest">
                      ${v.code || "---"}
                    </button>
                </div>`;
      } else {
        rows = `
                <div class="border-b border-gray-50 last:border-0 py-4 flex items-center justify-between text-zinc-900 gap-3">
                    <span class="text-sm font-black text-gray-500 uppercase italic leading-none text-left truncate">Variações (${item.vars.length})</span>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button onclick="Sistema.abrirVariacoesMaterial('${
                          item.root
                        }')" class="px-4 py-2 bg-gray-100 rounded-xl font-black text-xs text-zinc-600 border-none cursor-pointer hover:bg-zinc-900 hover:text-white transition-all uppercase shadow-sm">VER</button>
                    </div>
                </div>`;
      }

      card.innerHTML = `
                <div class="relative h-56 rounded-[2rem] overflow-hidden mb-6 bg-zinc-50 group flex items-center justify-center p-4">
                    <img src="${
                      item.f ||
                      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800"
                    }" class="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110">
                    
                    <!-- Etiqueta Flutuante -->
                    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/50">
                        <span class="text-[10px] font-black uppercase tracking-widest text-zinc-800">Estoque</span>
                    </div>
                </div>
                <div class="px-2 pb-2 text-gray-900">
                    <h3 class="text-xl font-black uppercase italic leading-tight mb-4 text-zinc-900 text-left break-words">${
                      item.root
                    }</h3>
                    <div class="space-y-1 text-left bg-white rounded-2xl">${rows}</div>
                </div>`;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================
  // 3. RENDERIZAÇÃO DE PEDIDOS
  // =========================================================
  _categoriaAtiva: "TODOS",

  filtrarCategoria(cat) {
    this._categoriaAtiva = cat;
    // Atualizar abas visuais
    document.querySelectorAll(".aba-categoria").forEach(btn => btn.classList.remove("aba-ativa"));
    const abaId = cat === "TODOS" ? "aba-todos" : cat === "EPI" ? "aba-epi" : "aba-material";
    const aba = document.getElementById(abaId);
    if (aba) aba.classList.add("aba-ativa");
    // Re-renderizar com filtro atual
    const buscaInput = document.getElementById("buscaPedido");
    const termoBusca = buscaInput ? buscaInput.value : "";
    const btnTodos = document.querySelector('[onclick*="sincronizarPedidos(true)"]');
    const tudo = State._filtroTudo || false;
    this.renderizarPedidos(tudo, termoBusca);
  },

  _isEPI(p) {
    const opc = (p.opc || "").toUpperCase();
    return opc.includes("EPI") || opc.includes("UNIFORME");
  },

  _atualizarContadoresAbas(dados) {
    const abas = document.getElementById("abasCategoria");
    if (abas) abas.classList.remove("hidden");

    const totalEpi = dados.filter(p => this._isEPI(p)).length;
    const totalMat = dados.filter(p => !this._isEPI(p)).length;

    const contTodos = document.getElementById("cont-todos");
    const contEpi = document.getElementById("cont-epi");
    const contMat = document.getElementById("cont-material");
    if (contTodos) contTodos.textContent = dados.length;
    if (contEpi) contEpi.textContent = totalEpi;
    if (contMat) contMat.textContent = totalMat;
  },

  renderizarPedidos(tudo = false, termoBusca = "") {
    const container = document.getElementById("gradeAtivos");
    const contador = document.getElementById("totalPedidosMonitor");

    if (!container) return;
    container.innerHTML = "";

    State._filtroTudo = tudo;
    let dados = State.pedidos || [];

    if (termoBusca && termoBusca.trim() !== "") {
      const termo = termoBusca.toUpperCase();
      dados = dados.filter((p) => {
        const nome = p.nome ? p.nome.toUpperCase() : "";
        const mat = p.mat ? p.mat.toString() : "";
        const equipe = p.equ ? p.equ.toUpperCase() : "";
        const tipo = p.opc ? p.opc.toUpperCase() : "";
        const id = p.id ? p.id.toUpperCase() : "";
        return (
          nome.includes(termo) ||
          mat.includes(termo) ||
          equipe.includes(termo) ||
          id.includes(termo) ||
          tipo.includes(termo)
        );
      });
    } else if (!tudo) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dados = dados.filter((p) => p.dataObj && p.dataObj >= hoje);
    }

    // Atualizar contadores das abas antes do filtro de categoria
    this._atualizarContadoresAbas(dados);

    // Aplicar filtro de categoria
    const cat = this._categoriaAtiva || "TODOS";
    if (cat === "EPI") {
      dados = dados.filter(p => this._isEPI(p));
    } else if (cat === "MATERIAL") {
      dados = dados.filter(p => !this._isEPI(p));
    }

    if (contador) contador.innerText = dados.length;

    if (dados.length === 0) {
      document.getElementById("vazio").classList.remove("hidden");
      const txtVazio = document.querySelector("#vazio p");
      if (txtVazio)
        txtVazio.innerText = tudo
          ? "Nenhum histórico encontrado."
          : "Nenhum pedido hoje.";
      return;
    }
    document.getElementById("vazio").classList.add("hidden");

    // Se estiver na aba Material, agrupar por DML
    if (cat === "MATERIAL") {
      this._renderizarAgrupadoPorDML(dados, container);
    } else {
      dados.forEach((p) => this._renderizarCardPedido(p, container));
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // Ícones por DML
  _dmlConfig: {
    "DML_COMERCIAL":  { icon: "shopping-bag", label: "Comercial",  cor: "text-purple-600 bg-purple-50 border-purple-200" },
    "DML_OFICINA":    { icon: "wrench",       label: "Oficina",    cor: "text-orange-600 bg-orange-50 border-orange-200" },
    "DML_INDUSTRIA":  { icon: "factory",      label: "Indústria",  cor: "text-sky-600 bg-sky-50 border-sky-200" },
    "DML_VESTIARIO":  { icon: "shirt",        label: "Vestiário",  cor: "text-pink-600 bg-pink-50 border-pink-200" },
    "DML_ESTOQUE":    { icon: "warehouse",    label: "Estoque",    cor: "text-amber-600 bg-amber-50 border-amber-200" },
    "DML_CCB":        { icon: "building-2",   label: "CCB",        cor: "text-teal-600 bg-teal-50 border-teal-200" },
  },

  _renderizarAgrupadoPorDML(dados, container) {
    // Agrupar pedidos por p.local (DML)
    const grupos = {};
    dados.forEach(p => {
      const dml = p.local || "SEM_DML";
      if (!grupos[dml]) grupos[dml] = [];
      grupos[dml].push(p);
    });

    // Ordem fixa dos DMLs
    const ordemDML = ["DML_COMERCIAL", "DML_OFICINA", "DML_INDUSTRIA", "DML_VESTIARIO", "DML_ESTOQUE", "DML_CCB"];
    const chaves = [...ordemDML.filter(k => grupos[k]), ...Object.keys(grupos).filter(k => !ordemDML.includes(k))];

    chaves.forEach(dml => {
      const cfg = this._dmlConfig[dml] || { icon: "package", label: dml.replace("DML_", "").replace("_", " "), cor: "text-gray-600 bg-gray-50 border-gray-200" };
      const pedidos = grupos[dml];

      // Header da seção
      const secao = document.createElement("div");
      secao.className = "col-span-full";
      secao.innerHTML = `
        <div class="flex items-center gap-3 mb-4 mt-6 first:mt-0">
          <div class="flex items-center gap-2.5 px-4 py-2 rounded-xl border ${cfg.cor}">
            <i data-lucide="${cfg.icon}" class="w-4 h-4"></i>
            <span class="text-xs font-black uppercase tracking-wider">${cfg.label}</span>
          </div>
          <span class="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''}</span>
          <div class="flex-1 h-px bg-gray-100"></div>
        </div>`;
      container.appendChild(secao);

      // Cards desse grupo
      pedidos.forEach(p => this._renderizarCardPedido(p, container));
    });
  },

  _renderizarCardPedido(p, container) {
      const card = document.createElement("div");
      const statusUpper = String(p.status || "AGUARDANDO LIDERANÇA")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const statusReprovada =
        statusUpper.includes("NAO APROV") ||
        statusUpper.includes("ERRO") ||
        statusUpper.includes("FALTA");
      const statusAprovada =
        (statusUpper.includes("APROVADA") || statusUpper.includes("BAIXADA")) &&
        !statusReprovada;
      const statusAmarela =
        statusUpper.includes("ANALISE") || statusUpper.includes("AGUARDANDO");
      const cardBgClass = statusAprovada
        ? "bg-emerald-50/60 border-emerald-200"
        : statusReprovada
        ? "bg-red-50/60 border-red-200"
        : statusAmarela
        ? "bg-amber-50/60 border-amber-200"
        : "bg-white border-gray-100";
      const cardBarClass = statusAprovada
        ? "bg-emerald-400"
        : statusReprovada
        ? "bg-red-400"
        : statusAmarela
        ? "bg-amber-300"
        : "bg-blue-400";

      card.id = `card-pedido-${p.id}`;
      card.className =
        "order-card relative rounded-2xl p-4 flex flex-col gap-0 animate-entrada-suave cursor-pointer shadow-lg hover:shadow-xl text-left text-zinc-900 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 border overflow-hidden " +
        cardBgClass;
      card.onclick = () => this.abrirDetalhesPedido(p);

      const isEPI =
        p.opc.toUpperCase().includes("EPI") ||
        p.opc.toUpperCase().includes("UNIFORME");
      const color = isEPI
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : "text-emerald-700 bg-emerald-50 border-emerald-200";
      const colabMatch = (State.colaboradores || []).find(c => String(c.matricula).trim() === String(p.mat).trim());
      const urlAvatar = (colabMatch && colabMatch.imagem) ? colabMatch.imagem : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        p.nome
      )}&background=F40009&color=fff&bold=true&size=128`;
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=F40009&color=fff&bold=true&size=128`;
      const horaFormatada = p.dt.includes(" ")
        ? p.dt.split(" ")[1].substring(0, 5)
        : "--:--";
      const dataFormatada = p.dt.split(" ")[0];

      // DML badge para cards de material (quando não está agrupado)
      const dmlCfg = this._dmlConfig[p.local] || null;
      const dmlBadge = (!isEPI && dmlCfg && this._categoriaAtiva !== "MATERIAL")
        ? `<span class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${dmlCfg.cor}">${dmlCfg.label}</span>`
        : "";

      card.innerHTML = `
                <div id="card-bar-${p.id}" class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cardBarClass}"></div>

                <div class="flex items-center gap-4 mb-4">
                    <div class="relative flex-shrink-0">
                        <img src="${urlAvatar}" class="w-12 h-12 rounded-full shadow-md border-2 border-white object-cover" alt="Perfil" onerror="this.src='${fallbackAvatar}';this.onerror=null;">
                        <div class="absolute -bottom-0.5 -right-0.5 rounded-full p-[3px] shadow-sm ${isEPI ? 'bg-blue-500' : 'bg-emerald-500'}">
                             ${
                               isEPI
                                 ? '<i data-lucide="shield" class="w-2.5 h-2.5 text-white"></i>'
                                 : '<i data-lucide="package" class="w-2.5 h-2.5 text-white"></i>'
                             }
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-extrabold uppercase text-gray-900 leading-tight line-clamp-2">${p.nome}</h3>
                        <div class="flex items-center gap-1.5 mt-1">
                            <span class="text-[10px] font-semibold text-gray-500">MAT: ${p.mat}</span>
                            ${p.id ? `<span class="text-[9px] text-gray-300">•</span><span class="text-[10px] font-mono text-gray-400">#${p.id}</span>` : ""}
                            ${dmlBadge}
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${color} tracking-wide">${p.opc}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1 text-gray-400">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            <span class="text-[10px] font-medium">${horaFormatada}</span>
                        </div>
                        <div class="bg-zinc-900 hover:bg-zinc-700 rounded-full p-1.5 transition-colors">
                            <i data-lucide="arrow-right" class="w-3 h-3 text-white"></i>
                        </div>
                    </div>
                </div>`;
      container.appendChild(card);
  },

  // =========================================================
  // 4. DETALHES DO PEDIDO
  // =========================================================
  abrirDetalhesPedido(p) {
    const colabMatch = (State.colaboradores || []).find(c => String(c.matricula).trim() === String(p.mat).trim());
    const urlAvatar = (colabMatch && colabMatch.imagem) ? colabMatch.imagem : `https://ui-avatars.com/api/?name=${encodeURIComponent(
      p.nome
    )}&background=F40009&color=fff&bold=true&size=256`;
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=F40009&color=fff&bold=true&size=256`;
    if (!this._itensAprovacao) this._itensAprovacao = {};
    this._itensAprovacao[p.id] = {};

    const itensHtml = p.its
      .split("|")
      .map((i, idx) => {
        const raw = i.trim();
        if (!raw) return "";
        const temOK = raw.includes("{OK}");
        const temNAO = raw.includes("{NAO}");
        const temFalta = raw.includes("{FALTA}");
        const limpo = raw.replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").trim();
        const match = limpo.match(/^(.*)\[(.+)\]\s*$/);
        const nomeItem = match ? match[1].trim() : limpo;
        const codigoItem = match ? match[2].trim() : "";
        const codigoFinal = (codigoItem && /^\d+$/.test(codigoItem)) ? codigoItem : "";
        const codigoSafe = codigoFinal.replace(/'/g, "\\'");

        if (temOK) this._itensAprovacao[p.id][idx] = true;
        else if (temNAO) this._itensAprovacao[p.id][idx] = false;
        else if (temFalta) this._itensAprovacao[p.id][idx] = "falta";

        const estadoClass = temOK ? "border-emerald-200 bg-emerald-50/50" : temNAO ? "border-red-200 bg-red-50/50" : temFalta ? "border-amber-200 bg-amber-50/50" : "border-[#e5e7eb] bg-white";

        return `<div id="item-aprov-${p.id}-${idx}" class="flex items-center gap-3 px-4 py-3 rounded-2xl border ${estadoClass} transition-all">
                <div class="flex-1 min-w-0">
                  <span class="text-[13px] font-bold uppercase text-[#111827] break-words leading-snug">${nomeItem}</span>
                  ${codigoFinal
                    ? `<button onclick="UI.copiarCodigo('${codigoSafe}')" class="mt-1.5 text-[10px] font-bold text-[#9ca3af] bg-[#f3f4f6] border border-[#e5e7eb] px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 hover:border-[#f40009] hover:text-[#f40009] transition-colors cursor-pointer">COD: ${codigoFinal} <i data-lucide="copy" class="w-3 h-3"></i></button>`
                    : ""
                  }
                </div>
                <div class="flex gap-1.5 flex-shrink-0">
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, true)" id="btn-ok-${p.id}-${idx}" class="w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${temOK ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-emerald-300 hover:text-emerald-500'}">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, 'falta')" id="btn-falta-${p.id}-${idx}" class="w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${temFalta ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-amber-300 hover:text-amber-500'}">
                    <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, false)" id="btn-nao-${p.id}-${idx}" class="w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${temNAO ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-red-300 hover:text-red-500'}">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
            </div>`;
      })
      .join("");

    let statusAtual = p.status || "AGUARDANDO LIDERANÇA";
    if (p.id && (statusAtual === "AGUARDANDO LIDERANÇA" || statusAtual === "")) {
      Sistema.atualizarStatus(p.id, "EM ANÁLISE", p.sap || "");
      statusAtual = "EM ANÁLISE";
      p.status = "EM ANÁLISE";
    }

    const statusKey = statusAtual.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isReprovada = statusKey.includes("NAO APROV") || statusKey.includes("ERRO") || statusKey.includes("FALTA");
    const isAprovada = (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) && !isReprovada;
    const isAmarelo = statusKey.includes("ANALISE") || statusKey.includes("AGUARDANDO");
    const sapValue = (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) && p.sap && p.sap !== "NÃO APROVADA" ? p.sap : "";

    // Cores sutis — só um detalhe, não o fundo inteiro
    const statusDotClass = isAprovada ? "bg-emerald-500" : isReprovada ? "bg-red-500" : isAmarelo ? "bg-amber-400" : "bg-blue-400";
    const statusPainelClass = isAprovada ? "bg-emerald-50 border-emerald-200" : isReprovada ? "bg-red-50 border-red-200" : isAmarelo ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200";
    const statusBarClass = isAprovada ? "bg-emerald-400" : isReprovada ? "bg-red-400" : isAmarelo ? "bg-amber-300" : "bg-blue-500";
    const statusTextClass = isAprovada ? "text-emerald-600" : isReprovada ? "text-red-600" : isAmarelo ? "text-amber-600" : "text-blue-500";

    const larguraPopup = window.innerWidth < 768 ? "95%" : "520px";
    this._pedidoExport = { nome: p.nome, mat: p.mat, equ: p.equ, opc: p.opc, id: p.id, dt: p.dt, its: p.its, status: statusAtual, local: p.local || "" };

    const isEpiPopup = p.opc.toUpperCase().includes("EPI") || p.opc.toUpperCase().includes("UNIFORME");
    const localLabel = p.local ? p.local.replace('DML_', '').replace('_', ' ') : '';
    const localSafe = localLabel.replace(/'/g, "\\'");
    const dmlPopupCfg = this._dmlConfig[p.local] || null;
    const numItens = p.its.split("|").filter(i => i.trim()).length;
    const horaPopup = p.dt.includes(" ") ? p.dt.split(" ")[1].substring(0, 5) : "--:--";
    const dataPopup = p.dt.split(" ")[0];

    Swal.fire({
      background: "#ffffff",
      color: "#111827",
      padding: "0",
      showConfirmButton: false,
      showCloseButton: true,
      width: larguraPopup,
      html: `
                <div id="popupPedidoContainer" class="text-left overflow-hidden text-[#111827]">
                    <!-- Header limpo -->
                    <div id="popupPedidoHeader" class="p-6 pb-5 border-b border-[#e5e7eb]">
                        <div class="flex items-center gap-4">
                            <img src="${urlAvatar}" class="w-14 h-14 rounded-[18px] border-2 border-[#e5e7eb] object-cover" style="box-shadow: 0 4px 10px rgba(0,0,0,0.1);" alt="Foto" onerror="this.src='${fallbackAvatar}';this.onerror=null;">
                            <div class="flex-1 min-w-0">
                                <h2 class="text-[15px] font-black uppercase leading-tight text-[#111827]" style="font-family:'Inter',sans-serif;">${p.nome}</h2>
                                <div class="flex items-center gap-2 mt-1.5">
                                    <span class="w-2 h-2 rounded-full ${statusDotClass} flex-shrink-0"></span>
                                    <span class="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">${statusAtual}</span>
                                </div>
                            </div>
                            <button onclick="${isEpiPopup ? "UI.toggleSecaoPopup('secaoPreview');document.getElementById('secaoPreview')?.scrollIntoView({behavior:'smooth',block:'center'})" : "UI.exportarPedido(UI._pedidoExport)"}" class="w-10 h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl flex items-center justify-center text-[#9ca3af] hover:border-[#f40009] hover:text-[#f40009] transition-all flex-shrink-0 active:scale-95 cursor-pointer" title="Compartilhar">
                                <i data-lucide="share-2" class="w-4 h-4"></i>
                            </button>
                        </div>

                        <!-- Dados em linha -->
                        <div class="flex flex-wrap gap-2 mt-4">
                            <div class="bg-[#f3f4f6] px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#e5e7eb] transition-colors group flex items-center gap-1.5" onclick="UI.copiarCodigo('${p.mat}')" title="Copiar">
                                <span class="text-[10px] font-bold text-[#9ca3af] uppercase">Mat</span>
                                <span class="text-[11px] font-black text-[#111827]">${p.mat}</span>
                                <i data-lucide="copy" class="w-3 h-3 text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                            <div class="bg-[#f3f4f6] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <span class="text-[10px] font-bold text-[#9ca3af] uppercase">Equipe</span>
                                <span class="text-[11px] font-black text-[#111827]">${p.equ}</span>
                            </div>
                            ${p.local ? `<div class="bg-[#f3f4f6] px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#e5e7eb] transition-colors group flex items-center gap-1.5" onclick="UI.copiarCodigo('${localSafe}')" title="Copiar">
                                <span class="text-[10px] font-bold text-[#9ca3af] uppercase">Local</span>
                                <span class="text-[11px] font-black text-[#111827]">${localLabel}</span>
                                <i data-lucide="copy" class="w-3 h-3 text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </div>` : ''}
                            <div class="bg-[#f3f4f6] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <span class="text-[10px] font-bold text-[#9ca3af] uppercase">ID</span>
                                <span class="text-[11px] font-black text-[#111827]">#${p.id || "N/A"}</span>
                            </div>
                            <div class="bg-[#f3f4f6] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <i data-lucide="clock" class="w-3 h-3 text-[#9ca3af]"></i>
                                <span class="text-[10px] font-bold text-[#9ca3af]">${dataPopup} ${horaPopup}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Corpo -->
                    <div class="p-6 space-y-5">
                        <!-- Status -->
                        <div id="popupStatusCard" class="p-4 rounded-2xl border relative overflow-hidden ${statusPainelClass}">
                            <div id="popupStatusBar" class="absolute top-0 left-0 w-1 h-full rounded-l-2xl ${statusBarClass}"></div>
                            <p id="popupStatusTitle" class="text-[9px] font-black uppercase tracking-[0.15em] mb-2 pl-3 ${statusTextClass}">Status</p>
                            <div class="relative pl-2">
                                <select id="selectStatusAdmin" onchange="UI.handleStatusChange('${p.id}')" class="w-full bg-white border border-[#e5e7eb] text-[#111827] text-sm font-bold rounded-xl p-3 pl-4 outline-none focus:border-[#f40009] transition-all appearance-none cursor-pointer uppercase" ${statusAtual === "APROVADA" || statusAtual === "NÃO APROVADA" ? "disabled" : ""}>
                                    <option value="EM ANÁLISE" ${statusAtual === "EM ANÁLISE" || statusAtual === "AGUARDANDO LIDERANÇA" ? "selected" : ""}>Em Análise</option>
                                    <option value="APROVADA" ${statusAtual === "APROVADA" || statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA" ? "selected" : ""}>Aprovada</option>
                                    <option value="NÃO APROVADA" ${statusAtual === "NÃO APROVADA" ? "selected" : ""}>Não Aprovada</option>
                                </select>
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af]">
                                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                                </div>
                            </div>
                            <p id="msgStatus" class="text-[8px] text-[#9ca3af] mt-1 pl-3 h-3 transition-all font-bold"></p>
                        </div>

                        <!-- SAP (só visível quando APROVADA) -->
                        <div id="secaoSAP" class="bg-white p-4 rounded-2xl border border-[#e5e7eb] transition-all" style="display:none;">
                            <p class="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.15em] mb-2">Código SAP (Retirada)</p>
                            <input id="inputSapCodigo" type="text" value="${sapValue}" placeholder="Informe o código do SAP" class="w-full bg-[#f9fafb] border border-[#e5e7eb] text-[#111827] text-sm font-bold rounded-xl p-3 outline-none focus:border-[#f40009] transition-all uppercase">
                            <p class="text-[8px] text-[#9ca3af] mt-2">Obrigatório para aprovar a solicitação.</p>
                        </div>

                        <!-- Itens (botões de ação só quando APROVADA) -->
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <p class="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.15em]">Itens Solicitados</p>
                                <span class="text-[9px] font-bold text-[#9ca3af] bg-[#f3f4f6] px-2.5 py-1 rounded-xl">${numItens} ${numItens === 1 ? 'item' : 'itens'}</span>
                            </div>
                            <div class="space-y-2">${itensHtml}</div>
                        </div>

                        <!-- Botão Concluir (só quando APROVADA ou NÃO APROVADA) -->
                        <div id="secaoConcluir" style="display:none;">
                            <button id="btnConcluirAprovacao" onclick="UI.concluirAprovacao('${p.id}')" class="w-full py-3 rounded-xl font-black uppercase text-[11px] tracking-[0.15em] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed border-none cursor-pointer" style="background:linear-gradient(135deg,#f40009 0%,#900005 100%);color:#fff;box-shadow:0 4px 15px rgba(244,0,9,0.3);" disabled>Concluir Aprovação</button>
                        </div>

                        ${isEpiPopup ? `
                        <!-- Compartilhar com Gestores (só EPI/Uniforme) -->
                        <div class="border border-[#e5e7eb] rounded-2xl overflow-hidden">
                            <button onclick="UI.toggleSecaoPopup('secaoPreview')" class="w-full flex items-center justify-between px-4 py-3 bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors cursor-pointer border-none text-left">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="share-2" class="w-4 h-4 text-[#f40009]"></i>
                                    <span class="text-[10px] font-black uppercase tracking-[0.1em] text-[#111827]">Compartilhar com Gestores</span>
                                </div>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-[#9ca3af] transition-transform" id="iconPreview"></i>
                            </button>
                            <div id="secaoPreview" class="hidden px-4 pb-4 pt-2">
                                <p class="text-[9px] text-[#9ca3af] font-bold mb-3">Pré-visualização da imagem para enviar no grupo</p>
                                <div id="previewContainer" class="flex justify-center mb-3">
                                    <div class="w-8 h-8 border-2 border-[#e5e7eb] border-t-[#f40009] rounded-full animate-spin"></div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="UI.exportarPedido(UI._pedidoExport)" class="flex-1 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb] hover:border-[#f40009] hover:text-[#f40009] transition-all cursor-pointer flex items-center justify-center gap-2">
                                        <i data-lucide="image" class="w-3.5 h-3.5"></i> Gerar Imagem
                                    </button>
                                    <button onclick="UI.copiarImagemExport()" id="btnCopiarInline" class="flex-1 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider bg-[#25D366] text-white border-none hover:bg-[#20bd5a] transition-all cursor-pointer flex items-center justify-center gap-2" style="box-shadow:0 2px 8px rgba(37,211,102,0.2);">
                                        <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Histórico EPI/Uniforme do Colaborador (aberto por padrão) -->
                        <div class="border border-[#e5e7eb] rounded-2xl overflow-hidden">
                            <div class="flex items-center justify-between px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="history" class="w-4 h-4 text-blue-500"></i>
                                    <span class="text-[10px] font-black uppercase tracking-[0.1em] text-[#111827]">Histórico de Solicitações</span>
                                </div>
                                <span id="contHistorico" class="text-[9px] font-bold text-[#9ca3af] bg-white px-2.5 py-0.5 rounded-lg border border-[#e5e7eb]"></span>
                            </div>
                            <div id="tabelaHistorico" class="px-4 pb-4 pt-2">
                                <div class="flex justify-center py-4">
                                    <div class="w-6 h-6 border-2 border-[#e5e7eb] border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- WhatsApp -->
                        <button onclick="Sistema.notificarWhatsApp('${p.nome}', '${p.mat}')" class="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2" style="box-shadow:0 4px 15px rgba(37,211,102,0.3);">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            Avisar no WhatsApp
                        </button>
                    </div>
                </div>`,
      didOpen: () => {
        window.lucide.createIcons();
        const inputSap = document.getElementById("inputSapCodigo");
        if (inputSap) inputSap.addEventListener("input", () => UI.atualizarBotaoAprovacao());

        const isLocked = statusAtual === "APROVADA" || statusAtual === "NÃO APROVADA" ||
           statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA";

        if (inputSap && isLocked) {
          inputSap.dataset.locked = "true";
        }

        // Aplicar visibilidade inicial das seções
        this._atualizarVisibilidadeSecoes(statusAtual);

        // Se já finalizado, bloquear tudo e mostrar seções como readonly
        if (isLocked) {
          const secaoSAP = document.getElementById("secaoSAP");
          const secaoConcluir = document.getElementById("secaoConcluir");
          // Mostrar SAP se aprovada (com valor), esconder se reprovada
          if (statusAtual === "APROVADA" || statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA") {
            if (secaoSAP) secaoSAP.style.display = "block";
          }
          if (secaoConcluir) secaoConcluir.style.display = "block";
          document.querySelectorAll('[id^="btn-ok-"], [id^="btn-nao-"], [id^="btn-falta-"]').forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.4";
            btn.style.display = "flex";
          });
        }

        this.atualizarBotaoAprovacao();
        this.atualizarSapLock();
        this.atualizarCoresPopupStatus(statusAtual);

        // Carregar histórico automaticamente para EPI/Uniforme
        if (document.getElementById("tabelaHistorico")) {
          this._carregarHistoricoEPI();
        }
      },
      customClass: { popup: "swal2-popup-custom" },
    });
  },

  // =========================================================
  // 5. DETALHES DE PRODUTO
  // =========================================================
  abrirDetalhesMaterial(nome, varLabel, cod, foto, subData) {
    const subCodesHtml = subData
      ? `
            <div class="mt-6 pt-6 border-t border-gray-100 text-left">
                <p class="text-[10px] font-black uppercase tracking-widest mb-3 text-gray-400">Variações</p>
                <div class="grid grid-cols-1 gap-2">
                    ${subData
                      .split("|")
                      .map((s) => {
                        const parts = s.split(":");
                        return `<div class="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
                                    <div>
                                        <p class="text-[9px] text-gray-400 font-bold uppercase">${
                                          parts[0]
                                        }</p>
                                        <p class="text-sm font-black text-zinc-900">${
                                          parts[1] || ""
                                        }</p>
                                    </div>
                                    <button onclick="Sistema.copiarCodigo('${
                                      parts[1]
                                    }')" class="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-zinc-400 hover:text-red-600 cursor-pointer border-none shadow-sm">
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>`;
                      })
                      .join("")}
                </div>
            </div>`
      : "";

    const larguraPopup = window.innerWidth < 768 ? "95%" : "600px";

    Swal.fire({
      background: "#fff",
      color: "#000",
      padding: "0",
      showConfirmButton: false,
      showCloseButton: true,
      width: larguraPopup,
      html: `
                <div class="text-left overflow-hidden bg-white text-gray-900 shadow-xl text-left rounded-[2rem]">
                    <div class="relative h-64 bg-gray-100">
                        <img src="${
                          foto ||
                          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800"
                        }" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div class="absolute bottom-4 left-6 right-6 text-left">
                            <h2 class="text-2xl font-black uppercase italic leading-none mb-1 text-white drop-shadow-md break-words">${nome}</h2>
                            <p class="text-white/80 font-bold uppercase tracking-widest text-[10px]">${varLabel}</p>
                        </div>
                    </div>
                    
                    <div class="p-6 text-left text-gray-900">
                        <div class="bg-zinc-50 p-5 rounded-2xl mb-6 border border-gray-100 shadow-inner">
                            <div class="space-y-1 text-left">
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código Principal</p>
                                <div class="flex items-center justify-between">
                                    <p class="text-3xl font-black text-zinc-900 tracking-tighter">${cod}</p>
                                    <button onclick="Sistema.copiarCodigo('${cod}')" class="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors border-none cursor-pointer">
                                        <i data-lucide="copy" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                            ${subCodesHtml}
                        </div>
                        
                        <button onclick="Swal.close()" class="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg border-none cursor-pointer">Fechar Visualização</button>
                    </div>
                </div>`,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => window.lucide.createIcons(),
    });
  },

  abrirVariacoesMaterial(nome) {
    const item = State.ativos.find((i) => i.root === nome);
    if (!item) return;
    this.abrirVariacoesItem(item);
  },

  abrirVariacoesItem(item) {
    if (!item) return;

    const lista = item.vars
      .map((v) => {
        return `
          <div class="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
            <div>
              <p class="text-[9px] text-gray-400 font-bold uppercase">${
                v.label
              }</p>
              <p class="text-sm font-black text-zinc-900">${v.code}</p>
            </div>
            <button onclick="Sistema.copiarCodigo('${
              v.code
            }')" class="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-zinc-400 hover:text-red-600 cursor-pointer border-none shadow-sm">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      })
      .join("");

    const larguraPopup = window.innerWidth < 768 ? "95%" : "520px";

    Swal.fire({
      background: "#fff",
      color: "#000",
      padding: "0",
      showConfirmButton: false,
      showCloseButton: true,
      width: larguraPopup,
      html: `
        <div class="text-left overflow-hidden bg-white text-gray-900 shadow-xl rounded-[2rem]">
          <div class="relative bg-zinc-50 flex items-center justify-center p-6" style="min-height:180px;">
            <img src="${
              item.f ||
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800"
            }" class="max-h-44 w-auto object-contain mix-blend-multiply">
          </div>
          <div class="p-5 sm:p-6 text-left text-gray-900">
            <h2 class="text-lg sm:text-xl font-black uppercase leading-tight mb-1 text-zinc-900 break-words">${
                item.root
              }</h2>
            <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Variações (${item.vars.length})</p>
            <div class="grid grid-cols-2 gap-2">
              ${lista}
            </div>
            <button onclick="Swal.close()" class="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg border-none cursor-pointer mt-5">Fechar</button>
          </div>
        </div>
      `,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => window.lucide.createIcons(),
    });
  },

  abrirFormularioSolicitacao() {
    Swal.fire({
      html: `<div class="w-full h-[75vh] overflow-hidden rounded-2xl bg-white relative"><iframe src="https://docs.google.com/forms/d/e/1FAIpQLScIvKki4ajHJSEtbgTuynXHb349YUFKHlwyMuZTqhM0Q4q0FA/viewform?embedded=true" class="w-full h-full border-0" marginheight="0" marginwidth="0">Carregando…</iframe></div>`,
      showConfirmButton: false,
      showCloseButton: true,
      width: "95%",
      padding: "0",
      background: "transparent",
      customClass: { popup: "swal2-popup-custom" },
    });
  },

  // =========================================================
  // 6. RASTREAMENTO PÚBLICO
  // =========================================================
  abrirPopupRastreio() {
    Swal.fire({
      html: `
        <div style="font-family: 'Space Grotesk', sans-serif;">
            <div class="text-center mb-6">
                <div class="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i data-lucide="radar" class="w-6 h-6 text-white"></i>
                </div>
                <h2 class="text-lg font-black uppercase tracking-wide text-zinc-900">Rastrear Pedido</h2>
                <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-1">Digite o ID ou matrícula</p>
            </div>
            <div class="relative group">
                <input id="inputRastreio" type="text" placeholder="Ex: #0425962 ou 12345" class="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-4 pl-12 text-sm font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:bg-white focus:ring-4 focus:ring-red-50 transition-all duration-200 uppercase placeholder-zinc-300" style="font-family: 'Space Grotesk', sans-serif;">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#F40009] transition-colors duration-200">
                    <i data-lucide="search" class="w-5 h-5"></i>
                </div>
            </div>
            <button onclick="
                const val = document.getElementById('inputRastreio').value;
                if(!val){document.getElementById('inputRastreio').style.borderColor='#F40009';setTimeout(()=>document.getElementById('inputRastreio').style.borderColor='',800);return;}
                Swal.close();
                window.Sistema.processarRastreio(val);
            " class="w-full mt-4 bg-[#F40009] text-white py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest hover:shadow-[0_8px_25px_rgba(244,0,9,0.3)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer">
                <i data-lucide="search" class="w-4 h-4"></i> Buscar
            </button>
            <button onclick="Swal.close()" class="w-full mt-2 py-2.5 font-bold text-[10px] uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-600 transition-colors border-none cursor-pointer bg-transparent">
                Cancelar
            </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      background: "#fff",
      padding: "1.5rem",
      customClass: { popup: "swal2-popup-custom" },
      width: window.innerWidth < 640 ? "92%" : "400px",
      didOpen: () => {
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById("inputRastreio");
        input.focus();
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const val = input.value;
            if (!val) { input.style.borderColor = '#F40009'; setTimeout(() => input.style.borderColor = '', 800); return; }
            Swal.close();
            window.Sistema.processarRastreio(val);
          }
        });
      },
    });
  },

  mostrarResultadoUnico(p) {
    this.abrirDetalhesPedido(p);
  },

  mostrarHistoricoUsuario(lista) {
    if (lista.length === 0) {
      Swal.fire({
        title: "",
        html: `
          <div class="flex flex-col items-center py-2">
            <div class="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 border-2 border-zinc-200">
              <i data-lucide="search-x" class="w-6 h-6 text-zinc-400"></i>
            </div>
            <h3 class="text-base font-black text-zinc-900 uppercase tracking-wide">Nada Encontrado</h3>
            <p class="text-[11px] text-zinc-400 font-bold mt-1">Não encontramos solicitações para esta matrícula.</p>
          </div>`,
        confirmButtonColor: "#F40009",
        confirmButtonText: "ENTENDI",
        customClass: { popup: "swal2-popup-custom" },
        didOpen: () => { if (window.lucide) window.lucide.createIcons(); }
      });
      return;
    }

    const htmlLista = lista
      .slice(0, 5)
      .map((p) => {
        const statusKey = (p.status || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isAprov = (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) && !statusKey.includes("NAO");
        const isRepr = statusKey.includes("NAO APROV");
        const isAnalise = !isAprov && !isRepr;

        const statusDot = isAprov ? "bg-emerald-500" : isRepr ? "bg-red-500" : "bg-amber-400";
        const statusLabel = isAprov ? "Aprovada" : isRepr ? "Não Aprovada" : "Em Análise";
        const statusBadge = isAprov ? "text-emerald-700 bg-emerald-50 border-emerald-200" : isRepr ? "text-red-700 bg-red-50 border-red-200" : "text-amber-700 bg-amber-50 border-amber-200";
        const cardBorder = isAprov ? "border-emerald-100" : isRepr ? "border-red-100" : "border-[#e5e7eb]";

        const temSap = p.sap && p.sap !== "NÃO APROVADA" && isAprov;
        const hora = p.dt.includes(" ") ? p.dt.split(" ")[1].substring(0, 5) : "";

        return `
            <div class="bg-white p-4 rounded-2xl border ${cardBorder} mb-2 text-left relative overflow-hidden transition-all">
                <div class="absolute top-0 left-0 w-1 h-full rounded-l-2xl ${statusDot}"></div>

                <div class="flex items-center justify-between mb-3 pl-2">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${statusDot}"></div>
                        <span class="text-[10px] font-black uppercase ${isAprov ? 'text-emerald-600' : isRepr ? 'text-red-500' : 'text-amber-600'}">${statusLabel}</span>
                        ${temSap ? `<span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">SAP: ${p.sap}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5 text-[#9ca3af]">
                        <span class="text-[9px] font-bold">${p.dt.split(" ")[0]}</span>
                        ${hora ? `<span class="text-[9px] font-bold">${hora}</span>` : ''}
                    </div>
                </div>

                <div class="pl-2 space-y-1 mb-3">${p.its.split("|").map(item => {
                  const raw = item.trim();
                  const isOK = raw.includes("{OK}");
                  const isNAO = raw.includes("{NAO}");
                  const isFalta = raw.includes("{FALTA}");
                  const clean = raw.replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
                  if (!clean) return "";
                  const icon = isOK
                    ? '<div class="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center flex-shrink-0"><svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>'
                    : isNAO
                    ? '<div class="w-4 h-4 rounded-md bg-red-400 flex items-center justify-center flex-shrink-0"><svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></div>'
                    : isFalta
                    ? '<div class="w-4 h-4 rounded-md bg-amber-400 flex items-center justify-center flex-shrink-0"><svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/></svg></div>'
                    : '<div class="w-4 h-4 rounded-md bg-[#e5e7eb] flex-shrink-0"></div>';
                  const textClass = isNAO ? "text-[#9ca3af] line-through" : isFalta ? "text-amber-700" : "text-[#111827]";
                  return `<div class="flex items-center gap-2 py-0.5">${icon}<span class="text-[12px] font-bold uppercase ${textClass}">${clean}</span></div>`;
                }).join("")}</div>

                <div class="flex items-center justify-between pl-2">
                    <span class="text-[8px] font-bold text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-lg">#${p.id}</span>
                    ${isAnalise ? `<span class="text-[8px] text-[#9ca3af] font-bold flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> Até 48h para atualização</span>` : ''}
                </div>
            </div>`;
      })
      .join("");

    Swal.fire({
      title: "",
      width: window.innerWidth < 640 ? "92%" : "32em",
      html: `
        <div class="text-center mb-4">
          <div class="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i data-lucide="clock" class="w-5 h-5 text-white"></i>
          </div>
          <h3 class="text-lg font-black text-zinc-900 uppercase tracking-wide">Histórico</h3>
          <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-0.5">Suas solicitações recentes</p>
        </div>
        <div class="bg-zinc-50 p-2.5 rounded-2xl max-h-[55vh] overflow-y-auto custom-scroll">${htmlLista}</div>`,
      confirmButtonText: "FECHAR",
      confirmButtonColor: "#F40009",
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => { if (window.lucide) window.lucide.createIcons(); }
    });
  },

  // =========================================================
  // 7. ADMINISTRAÇÃO E GESTÃO
  // =========================================================
  abrirMenuGestao() {
    const btnNotificacoes =
      State.notificacoes > 0
        ? `<button onclick="Sistema.verSugestoes()" class="w-full bg-blue-50 text-blue-600 border border-blue-100 py-5 rounded-2xl font-bold hover:bg-blue-100 flex items-center justify-center gap-2 animate-entrada-suave shadow-sm mb-4">
                 <i data-lucide="inbox" class="w-6 h-6"></i>
                 <span class="text-sm">Ver Sugestões (${State.notificacoes})</span>
               </button>`
        : "";

    Swal.fire({
      title: "",
      width: window.innerWidth < 640 ? "92%" : "32em",
      html: `
                <div class="flex flex-col gap-3">
                    <div class="text-center mb-2">
                        <div class="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[#F40009] shadow-[0_4px_15px_rgba(244,0,9,0.1)]">
                            <i data-lucide="settings" class="w-7 h-7"></i>
                        </div>
                        <h3 class="text-xl font-black text-zinc-900">Gestão Rápida</h3>
                        <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Ferramentas administrativas</p>
                    </div>

                    ${btnNotificacoes}

                    <button onclick="Sistema.abrirPopupIdeias()" class="w-full bg-zinc-50 text-zinc-800 border-2 border-transparent py-4 rounded-2xl font-bold hover:border-yellow-400 hover:bg-yellow-50 transition-all flex items-center px-5 gap-4 group text-left active:scale-[0.98]">
                        <div class="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="lightbulb" class="w-5 h-5 text-yellow-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-black uppercase text-zinc-900">Nova Sugestão</p>
                            <p class="text-[10px] text-zinc-400 font-bold uppercase">Ideias & Inovação</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-yellow-500 transition-colors"></i>
                    </button>

                    <button onclick="UI.abrirContencaoLateral()" class="w-full bg-zinc-50 text-zinc-800 border-2 border-transparent py-4 rounded-2xl font-bold hover:border-orange-400 hover:bg-orange-50 transition-all flex items-center px-5 gap-4 group text-left active:scale-[0.98]">
                        <div class="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="archive" class="w-5 h-5 text-orange-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-black uppercase text-zinc-900">Contenção Lateral</p>
                            <p class="text-[10px] text-zinc-400 font-bold uppercase">Controle de Estoque</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors"></i>
                    </button>

                    <button onclick="Sistema.solicitarAcessoAdmin()" class="w-full bg-zinc-50 text-zinc-800 border-2 border-transparent py-4 rounded-2xl font-bold hover:border-red-400 hover:bg-red-50 transition-all flex items-center px-5 gap-4 group text-left active:scale-[0.98]">
                        <div class="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="lock" class="w-5 h-5 text-red-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-black uppercase text-zinc-900">Acesso Admin</p>
                            <p class="text-[10px] text-zinc-400 font-bold uppercase">Área Restrita</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-red-500 transition-colors"></i>
                    </button>
                </div>
            `,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => window.lucide.createIcons(),
      customClass: { popup: "swal2-popup-custom" },
    });
  },

  handleStatusChange(id) {
    const select = document.getElementById("selectStatusAdmin");
    const status = select ? select.value : "";

    // Mostrar/esconder seções baseado no status
    this._atualizarVisibilidadeSecoes(status);

    // Auto-marcar todos os itens baseado no status
    if (this._itensAprovacao && this._itensAprovacao[id]) {
      const pedido = State.pedidos.find(p => p.id == id);
      if (pedido) {
        const numItens = pedido.its.split("|").filter(i => i.trim()).length;
        if (status === "NÃO APROVADA") {
          for (let i = 0; i < numItens; i++) {
            this._itensAprovacao[id][i] = false;
            this._atualizarVisualItem(id, i);
          }
        } else if (status === "APROVADA") {
          for (let i = 0; i < numItens; i++) {
            this._itensAprovacao[id][i] = true;
            this._atualizarVisualItem(id, i);
          }
        } else if (status === "EM ANÁLISE") {
          for (let i = 0; i < numItens; i++) {
            delete this._itensAprovacao[id][i];
            this._atualizarVisualItem(id, i);
          }
        }
      }
    }

    this.atualizarBotaoAprovacao();
    this.atualizarSapLock();
    this.atualizarCoresPopupStatus(status);
  },

  _atualizarVisibilidadeSecoes(status) {
    const secaoSAP = document.getElementById("secaoSAP");
    const secaoConcluir = document.getElementById("secaoConcluir");
    const botoesItens = document.querySelectorAll('[id^="btn-ok-"], [id^="btn-nao-"], [id^="btn-falta-"]');

    if (status === "APROVADA") {
      // Mostra SAP, botão concluir e botões de item
      if (secaoSAP) secaoSAP.style.display = "block";
      if (secaoConcluir) secaoConcluir.style.display = "block";
      botoesItens.forEach(btn => {
        btn.style.display = "flex";
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
      });
    } else if (status === "NÃO APROVADA") {
      // Esconde SAP, mostra botão concluir, esconde botões de item
      if (secaoSAP) secaoSAP.style.display = "none";
      if (secaoConcluir) secaoConcluir.style.display = "block";
      botoesItens.forEach(btn => {
        btn.style.display = "none";
      });
    } else {
      // EM ANÁLISE: esconde tudo
      if (secaoSAP) secaoSAP.style.display = "none";
      if (secaoConcluir) secaoConcluir.style.display = "none";
      botoesItens.forEach(btn => {
        btn.style.display = "none";
      });
    }
  },

  _atualizarVisualItem(pedidoId, idx) {
    const estado = this._itensAprovacao[pedidoId]?.[idx];
    const container = document.getElementById(`item-aprov-${pedidoId}-${idx}`);
    const btnOk = document.getElementById(`btn-ok-${pedidoId}-${idx}`);
    const btnNao = document.getElementById(`btn-nao-${pedidoId}-${idx}`);
    const btnFalta = document.getElementById(`btn-falta-${pedidoId}-${idx}`);
    if (container) {
      container.className = container.className.replace(/border-\S+/g, "").replace(/bg-(emerald|red|amber|white)-50/g, "");
      if (estado === true) container.classList.add("border-emerald-200", "bg-emerald-50");
      else if (estado === false) container.classList.add("border-red-200", "bg-red-50");
      else if (estado === "falta") container.classList.add("border-amber-200", "bg-amber-50");
      else container.classList.add("border-gray-100", "bg-white");
    }
    if (btnOk) btnOk.className = `w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${estado === true ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-emerald-300 hover:text-emerald-500'}`;
    if (btnNao) btnNao.className = `w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${estado === false ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-red-300 hover:text-red-500'}`;
    if (btnFalta) btnFalta.className = `w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${estado === "falta" ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb] hover:border-amber-300 hover:text-amber-500'}`;
    if (window.lucide) window.lucide.createIcons();
  },

  atualizarBotaoAprovacao() {
    const btn = document.getElementById("btnConcluirAprovacao");
    if (!btn) return;
    const status = document.getElementById("selectStatusAdmin")?.value || "";
    const sap = document.getElementById("inputSapCodigo")?.value || "";
    const locked = document.getElementById("inputSapCodigo")?.dataset.locked === "true";
    const selectDisabled = document.getElementById("selectStatusAdmin")?.disabled;

    if (locked || selectDisabled) {
      btn.disabled = true;
      btn.innerText = "Concluído";
      btn.style.background = "#e5e7eb";
      btn.style.color = "#9ca3af";
      btn.style.boxShadow = "none";
      return;
    }

    if (status === "APROVADA") {
      const ok = sap.trim().length > 0;
      btn.disabled = !ok;
      btn.innerText = ok ? "Concluir Aprovação" : "Informe o SAP para concluir";
      btn.style.background = ok ? "linear-gradient(135deg,#f40009 0%,#900005 100%)" : "#e5e7eb";
      btn.style.color = ok ? "#fff" : "#9ca3af";
      btn.style.boxShadow = ok ? "0 4px 15px rgba(244,0,9,0.3)" : "none";
    } else if (status === "NÃO APROVADA") {
      btn.disabled = false;
      btn.innerText = "Confirmar Recusa";
      btn.style.background = "#ef4444";
      btn.style.color = "#fff";
      btn.style.boxShadow = "0 4px 15px rgba(239,68,68,0.3)";
    } else {
      btn.disabled = true;
      btn.innerText = "Selecione um status";
      btn.style.background = "#e5e7eb";
      btn.style.color = "#9ca3af";
      btn.style.boxShadow = "none";
    }
  },

  toggleItemAprovacao(pedidoId, idx, valor) {
    if (!this._itensAprovacao) this._itensAprovacao = {};
    if (!this._itensAprovacao[pedidoId]) this._itensAprovacao[pedidoId] = {};

    const estadoAtual = this._itensAprovacao[pedidoId][idx];
    if (estadoAtual === valor) {
      delete this._itensAprovacao[pedidoId][idx];
    } else {
      this._itensAprovacao[pedidoId][idx] = valor;
    }
    this._atualizarVisualItem(pedidoId, idx);
  },

  _montarItensComAprovacao(pedidoId, itensOriginal) {
    const estados = (this._itensAprovacao && this._itensAprovacao[pedidoId]) || {};
    return itensOriginal.split("|").map((item, idx) => {
      const limpo = item.trim().replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").trim();
      if (!limpo) return "";
      const estado = estados[idx];
      if (estado === true) return `${limpo} {OK}`;
      if (estado === false) return `${limpo} {NAO}`;
      if (estado === "falta") return `${limpo} {FALTA}`;
      return limpo;
    }).filter(Boolean).join(" | ");
  },

  toggleSecaoPopup(secaoId) {
    const secao = document.getElementById(secaoId);
    if (!secao) return;
    const isHidden = secao.classList.contains("hidden");
    secao.classList.toggle("hidden");
    // Rotacionar ícone
    const iconId = secaoId === "secaoPreview" ? "iconPreview" : "iconHistorico";
    const icon = document.getElementById(iconId);
    if (icon) icon.style.transform = isHidden ? "rotate(180deg)" : "";

    // Carregar histórico ao abrir pela primeira vez
    if (secaoId === "secaoHistorico" && isHidden) {
      this._carregarHistoricoEPI();
    }
    // Gerar preview ao abrir pela primeira vez
    if (secaoId === "secaoPreview" && isHidden) {
      this._gerarPreviewInline();
    }
  },

  _gerarPreviewInline() {
    const container = document.getElementById("previewContainer");
    if (!container || !this._pedidoExport) return;
    const p = this._pedidoExport;

    const colabMatch = (State.colaboradores || []).find(c => String(c.matricula).trim() === String(p.mat).trim());
    const avatarUrl = (colabMatch && colabMatch.imagem) ? colabMatch.imagem : "";
    const avatarHTML = avatarUrl
      ? `<img src="${avatarUrl}" crossorigin="anonymous" style="width:48px;height:48px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.3);">`
      : `<div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px;border:2px solid rgba(255,255,255,0.3);">${(p.nome || "?")[0]}</div>`;

    const itens = p.its.split("|").map(i => i.trim().replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim()).filter(Boolean);
    const itensHTML = itens.map(item =>
      `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:6px;">
        <div style="width:6px;height:6px;border-radius:50%;background:#F40009;flex-shrink:0;"></div>
        <span style="font-size:11px;font-weight:700;color:#111827;text-transform:uppercase;">${item}</span>
      </div>`
    ).join("");

    // Buscar histórico de entregas aprovadas ({OK}) para incluir na imagem
    const matAtual = String(p.mat).trim();
    const historicoAprovado = (State.pedidos || []).filter(h => {
      const mesmoColab = String(h.mat).trim() === matAtual;
      const ehEpi = h.opc && (h.opc.toUpperCase().includes("EPI") || h.opc.toUpperCase().includes("UNIFORME"));
      const naoEAtual = h.id !== p.id;
      const statusKey = (h.status || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const foiAprovado = (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) && !statusKey.includes("NAO");
      return mesmoColab && ehEpi && naoEAtual && foiAprovado;
    }).sort((a, b) => (b.dataObj || 0) - (a.dataObj || 0));

    // Montar HTML do histórico para a imagem
    let historicoHTML = "";
    if (historicoAprovado.length > 0) {
      const linhas = historicoAprovado.map(h => {
        const data = h.dt ? h.dt.split(" ")[0] : "--";
        const sap = h.sap || "--";
        const itensOK = h.its ? h.its.split("|").filter(i => i.includes("{OK}")).map(i => i.trim().replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim()).filter(Boolean) : [];
        if (itensOK.length === 0) return "";
        return `
          <div style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:9px;font-weight:700;color:#9ca3af;">${data}</span>
              <span style="font-size:8px;font-weight:700;color:#059669;background:#ecfdf5;padding:2px 8px;border-radius:8px;">SAP: ${sap}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${itensOK.map(it => `<span style="font-size:9px;font-weight:700;color:#111827;background:#f3f4f6;padding:3px 8px;border-radius:8px;text-transform:uppercase;">${it}</span>`).join('')}
            </div>
          </div>`;
      }).filter(Boolean).join("");

      if (linhas) {
        historicoHTML = `
          <div style="margin-top:16px;padding-top:14px;border-top:2px solid #e5e7eb;">
            <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Histórico de Entregas</div>
            ${linhas}
          </div>`;
      }
    }

    if (!historicoHTML) {
      historicoHTML = `
        <div style="margin-top:16px;padding-top:14px;border-top:2px solid #e5e7eb;text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#059669;background:#ecfdf5;padding:6px 14px;border-radius:10px;display:inline-block;text-transform:uppercase;letter-spacing:1px;">Nenhuma solicitação nos últimos 3 meses</div>
        </div>`;
    }

    const cardDiv = document.createElement("div");
    cardDiv.id = "exportCardInline";
    cardDiv.style.cssText = "position:fixed;top:-9999px;left:-9999px;z-index:-1;width:420px;font-family:'Inter',sans-serif;";
    cardDiv.innerHTML = `
      <div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#F40009 0%,#900005 100%);padding:20px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            ${avatarHTML}
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:900;color:#fff;text-transform:uppercase;line-height:1.2;">${p.nome}</div>
              <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;">${p.opc}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;">
              <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Matrícula</div>
              <div style="font-size:14px;font-weight:900;color:#fff;">${p.mat}</div>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;">
              <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Equipe</div>
              <div style="font-size:14px;font-weight:900;color:#fff;">${p.equ}</div>
            </div>
          </div>
        </div>
        <div style="padding:18px 20px 20px;">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Solicitação Atual</div>
          ${itensHTML}
          ${historicoHTML}
          <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;">
            <div style="font-size:8px;font-weight:700;color:#d4d4d8;text-transform:uppercase;letter-spacing:1.5px;">Protocolo #${p.id || "N/A"} · ${p.dt || ""}</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(cardDiv);

    if (typeof html2canvas !== "undefined") {
      html2canvas(cardDiv, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null }).then(canvas => {
        cardDiv.remove();
        canvas.style.cssText = "width:100%;max-width:320px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);";
        container.innerHTML = "";
        container.appendChild(canvas);
        this._exportCanvas = canvas;
      }).catch(() => { cardDiv.remove(); container.innerHTML = '<p class="text-[10px] text-red-400 text-center">Erro ao gerar preview</p>'; });
    }
  },

  _carregarHistoricoEPI() {
    const container = document.getElementById("tabelaHistorico");
    const contLabel = document.getElementById("contHistorico");
    if (!container || !this._pedidoExport) return;

    const matAtual = String(this._pedidoExport.mat).trim();
    const idAtual = this._pedidoExport.id;

    // Filtrar SOMENTE pedidos APROVADOS de EPI/Uniforme do mesmo colaborador
    const historico = (State.pedidos || []).filter(p => {
      const mesmoColab = String(p.mat).trim() === matAtual;
      const ehEpi = p.opc && (p.opc.toUpperCase().includes("EPI") || p.opc.toUpperCase().includes("UNIFORME"));
      const naoEAtual = p.id !== idAtual;
      const statusKey = (p.status || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const foiAprovado = (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) && !statusKey.includes("NAO");
      return mesmoColab && ehEpi && naoEAtual && foiAprovado;
    }).sort((a, b) => (b.dataObj || 0) - (a.dataObj || 0));

    // Contar apenas itens aprovados ({OK}) no total
    let totalItensAprovados = 0;

    const rows = historico.map(h => {
      const data = h.dt ? h.dt.split(" ")[0] : "--";
      const reserva = h.sap || "--";

      // Só mostrar itens que foram APROVADOS ({OK})
      const itensAprovados = h.its ? h.its.split("|").map(i => {
        const raw = i.trim();
        if (!raw.includes("{OK}")) return null; // Ignorar {NAO} e {FALTA}
        const limpo = raw.replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
        return limpo || null;
      }).filter(Boolean) : [];

      if (itensAprovados.length === 0) return ""; // Se nenhum item foi aprovado, não mostrar

      totalItensAprovados += itensAprovados.length;

      return `
        <div class="py-3 border-b border-[#f3f4f6] last:border-none">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
              <span class="text-[10px] font-bold text-[#9ca3af]">${data}</span>
            </div>
            <div class="flex items-center gap-1.5">
              ${reserva !== "--" ? `<span class="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">SAP: ${reserva}</span>` : ''}
              <span class="text-[8px] font-bold text-[#9ca3af] bg-[#f3f4f6] px-1.5 py-0.5 rounded-lg">#${h.id || 'N/A'}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 pl-4">
            ${itensAprovados.map(item => `<span class="text-[10px] font-bold text-[#111827] bg-[#f3f4f6] px-2.5 py-1 rounded-xl uppercase border border-[#e5e7eb]">${item}</span>`).join('')}
          </div>
        </div>`;
    }).filter(Boolean).join("");

    if (contLabel) contLabel.textContent = `${totalItensAprovados} entregue${totalItensAprovados !== 1 ? 's' : ''}`;

    if (!rows) {
      container.innerHTML = `
        <div class="text-center py-6">
          <i data-lucide="check-circle" class="w-8 h-8 text-emerald-200 mx-auto mb-2"></i>
          <p class="text-[10px] font-bold text-[#9ca3af]">Nenhuma solicitação aprovada nos últimos 3 meses</p>
          <p class="text-[9px] text-[#d4d4d8] mt-1">Este colaborador não retirou EPI/Uniforme neste período</p>
        </div>`;
      if (contLabel) contLabel.textContent = "0 entregas";
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `<div class="max-h-[250px] overflow-y-auto">${rows}</div>`;
    if (window.lucide) window.lucide.createIcons();
  },

  concluirAprovacao(id) {
    const status = document.getElementById("selectStatusAdmin")?.value || "";
    const sap = document.getElementById("inputSapCodigo")?.value || "";

    if (status !== "APROVADA" && status !== "NÃO APROVADA") {
      Swal.fire({
        icon: "info",
        title: "Selecione o Status",
        text: "Para concluir, selecione APROVADA ou NÃO APROVADA.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    if (status === "APROVADA" && !sap.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Código SAP obrigatório",
        text: "Informe o código SAP antes de aprovar.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    // Atualizar itens com marcadores de aprovação na planilha
    const pedido = State.pedidos.find(p => p.id == id);
    if (pedido) {
      const itensAtualizados = this._montarItensComAprovacao(id, pedido.its);
      if (itensAtualizados !== pedido.its) {
        pedido.its = itensAtualizados;
        Sistema.atualizarItens(id, itensAtualizados);
      }
    }

    Sistema.atualizarStatus(id, status, status === "NÃO APROVADA" ? "NÃO APROVADA" : sap.trim());

    // Bloquear tudo após aprovação (irreversível)
    const selectStatus = document.getElementById("selectStatusAdmin");
    if (selectStatus) selectStatus.disabled = true;
    const inputSap = document.getElementById("inputSapCodigo");
    if (inputSap) inputSap.dataset.locked = "true";

    // Bloquear botões de aprovação dos itens
    document.querySelectorAll('[id^="btn-ok-"], [id^="btn-nao-"], [id^="btn-falta-"]').forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.5";
    });

    this.atualizarSapLock();
    this.atualizarBotaoAprovacao();
    this.atualizarCoresPopupStatus(status);
  },

  atualizarSapLock() {
    const input = document.getElementById("inputSapCodigo");
    if (!input) return;
    const locked = input.dataset.locked === "true";
    input.disabled = locked;
    input.readOnly = locked;
    input.classList.toggle("bg-zinc-100", locked);
    input.classList.toggle("text-zinc-500", locked);
    input.classList.toggle("cursor-not-allowed", locked);
  },

  atualizarCoresPopupStatus(status) {
    const container = document.getElementById("popupPedidoContainer");
    const header = document.getElementById("popupPedidoHeader");
    const card = document.getElementById("popupStatusCard");
    const bar = document.getElementById("popupStatusBar");
    const title = document.getElementById("popupStatusTitle");
    const msg = document.getElementById("msgStatus");
    if (!container || !header || !card || !bar || !title) return;

    const upper = String(status || "").toUpperCase();
    const key = upper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isReprovada =
      key.includes("NAO APROV") || key.includes("ERRO") || key.includes("FALTA");
    const isAprovada =
      (key.includes("APROVADA") || key.includes("BAIXADA")) && !isReprovada;
    const isAmarelo = key.includes("ANALISE") || key.includes("AGUARDANDO");

    const bgClass = isAprovada
      ? "bg-emerald-50"
      : isReprovada
      ? "bg-red-50"
      : isAmarelo
      ? "bg-amber-50"
      : "bg-gray-50";
    const headerClass = isAprovada
      ? "bg-emerald-50"
      : isReprovada
      ? "bg-red-50"
      : isAmarelo
      ? "bg-amber-50"
      : "bg-white";
    const cardClass = isAprovada
      ? "bg-emerald-50 border-emerald-200"
      : isReprovada
      ? "bg-red-50 border-red-200"
      : isAmarelo
      ? "bg-amber-50 border-amber-200"
      : "bg-gray-50 border-gray-200";
    const barClass = isAprovada
      ? "bg-emerald-400"
      : isReprovada
      ? "bg-red-400"
      : isAmarelo
      ? "bg-amber-300"
      : "bg-blue-500";
    const titleClass = isAprovada
      ? "text-emerald-600"
      : isReprovada
      ? "text-red-600"
      : isAmarelo
      ? "text-amber-600"
      : "text-blue-500";

    container.classList.remove(
      "bg-emerald-50",
      "bg-amber-50",
      "bg-red-50",
      "bg-gray-50"
    );
    header.classList.remove(
      "bg-emerald-50",
      "bg-amber-50",
      "bg-red-50",
      "bg-white"
    );
    card.classList.remove(
      "bg-emerald-50",
      "border-emerald-200",
      "bg-amber-50",
      "border-amber-200",
      "bg-red-50",
      "border-red-200",
      "bg-gray-50",
      "border-gray-200"
    );
    bar.classList.remove("bg-emerald-400", "bg-amber-300", "bg-red-400", "bg-blue-500");
    title.classList.remove(
      "text-emerald-600",
      "text-amber-600",
      "text-red-600",
      "text-blue-500"
    );

    container.classList.add(bgClass);
    header.classList.add(headerClass);
    card.classList.add(...cardClass.split(" "));
    bar.classList.add(barClass);
    title.classList.add(titleClass);

    if (msg && msg.innerText) {
      msg.classList.remove(
        "text-emerald-600",
        "text-amber-600",
        "text-red-600",
        "text-blue-500"
      );
      msg.classList.add(
        isAprovada
          ? "text-emerald-600"
          : isReprovada
          ? "text-red-600"
          : isAmarelo
          ? "text-amber-600"
          : "text-blue-500"
      );
    }

    const swalPopup = document.querySelector(".swal2-popup");
    if (swalPopup) {
      swalPopup.style.backgroundColor = isAprovada
        ? "#ecfdf5"
        : isReprovada
        ? "#fef2f2"
        : isAmarelo
        ? "#fffbeb"
        : "#ffffff";
    }
  },

  atualizarCorCardLista(id, status) {
    const card = document.getElementById(`card-pedido-${id}`);
    const bar = document.getElementById(`card-bar-${id}`);
    if (!card) return;

    const upper = String(status || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isReprovada = upper.includes("NAO APROV") || upper.includes("ERRO") || upper.includes("FALTA");
    const isAprovada = (upper.includes("APROVADA") || upper.includes("BAIXADA")) && !isReprovada;
    const isAmarela = upper.includes("ANALISE") || upper.includes("AGUARDANDO");

    // Remover classes antigas do card
    card.classList.remove(
      "bg-emerald-50/60", "border-emerald-200",
      "bg-red-50/60", "border-red-200",
      "bg-amber-50/60", "border-amber-200",
      "bg-white", "border-gray-100"
    );
    // Adicionar novas classes
    if (isAprovada) { card.classList.add("bg-emerald-50/60", "border-emerald-200"); }
    else if (isReprovada) { card.classList.add("bg-red-50/60", "border-red-200"); }
    else if (isAmarela) { card.classList.add("bg-amber-50/60", "border-amber-200"); }
    else { card.classList.add("bg-white", "border-gray-100"); }

    // Atualizar barra lateral
    if (bar) {
      bar.classList.remove("bg-emerald-400", "bg-red-400", "bg-amber-300", "bg-blue-400");
      if (isAprovada) bar.classList.add("bg-emerald-400");
      else if (isReprovada) bar.classList.add("bg-red-400");
      else if (isAmarela) bar.classList.add("bg-amber-300");
      else bar.classList.add("bg-blue-400");
    }
  },

  solicitarAcessoAdmin() {
    Swal.fire({
      title: "Senha Admin",
      html: `
        <div class="mt-4 mb-2">
            <input id="swal-input-senha" type="password" placeholder="DIGITE A CHAVE" class="w-full bg-gray-100 border-none rounded-2xl p-4 text-center text-2xl font-black text-zinc-900 tracking-widest outline-none focus:ring-4 focus:ring-red-100 transition-all placeholder-gray-300">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "ENTRAR",
      confirmButtonColor: "#F40009",
      cancelButtonText: "CANCELAR",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const senha = document.getElementById("swal-input-senha").value;
        const valido = await Auth.validarSenha(senha);
        if (valido) return true;
        Swal.showValidationMessage("Chave incorreta");
        return false;
      },
      didOpen: () => {
        document.getElementById("swal-input-senha").focus();
      },
      customClass: { popup: "swal2-popup-custom" },
    }).then((result) => {
      if (result.isConfirmed) {
        this.mostrarLinksAdmin();
      }
    });
  },

  mostrarLinksAdmin() {
    Swal.fire({
      title: "Painel Admin",
      width: window.innerWidth < 640 ? "90%" : "32em",
      html: `
                <div class="flex flex-col gap-4 mt-6">
                    <a href="${settings.admin.planilha}" target="_blank" class="w-full bg-green-500 text-white py-5 rounded-2xl font-black hover:bg-green-600 flex items-center justify-center gap-3 no-underline shadow-lg shadow-green-200 active:scale-95 transition-all">
                        <i data-lucide="sheet" class="w-6 h-6"></i>
                        Acessar Planilha
                    </a>
                    <a href="${settings.admin.formulario}" target="_blank" class="w-full bg-purple-500 text-white py-5 rounded-2xl font-black hover:bg-purple-600 flex items-center justify-center gap-3 no-underline shadow-lg shadow-purple-200 active:scale-95 transition-all">
                        <i data-lucide="file-edit" class="w-6 h-6"></i>
                        Editar Formulário
                    </a>
                </div>
            `,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => window.lucide.createIcons(),
      customClass: { popup: "swal2-popup-custom" },
    });
  },

  notificarWhatsApp(nome, matricula) {
    const texto = `Olá, sou ${nome} (Matrícula: ${matricula}). Gostaria de saber sobre o status do meu pedido.`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  },

  copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
      // Feedback visual sem fechar o popup principal (sem Swal.fire)
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 z-[99999] bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider animate-entrada-suave";
      toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 1500);
    });
  },

  async exportarPedido(p) {
    if (!p) return;
    // Força refresh dos colaboradores para capturar número de WhatsApp recém-adicionado
    try { await Api.carregarColaboradores(); } catch {}
    const colabMatch = (State.colaboradores || []).find(c => String(c.matricula).trim() === String(p.mat).trim());
    const avatarUrl = (colabMatch && colabMatch.imagem) ? colabMatch.imagem : "";
    const avatarHTML = avatarUrl
      ? `<img src="${avatarUrl}" crossorigin="anonymous" style="width:64px;height:64px;border-radius:16px;object-fit:cover;border:3px solid rgba(255,255,255,0.3);box-shadow:0 4px 15px rgba(0,0,0,0.2);">`
      : `<div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:24px;border:3px solid rgba(255,255,255,0.3);box-shadow:0 4px 15px rgba(0,0,0,0.2);">${(p.nome || "?")[0]}</div>`;

    const itens = p.its.split("|").map(i => {
      const raw = i.trim().replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
      return raw || "";
    }).filter(Boolean);

    const itensHTML = itens.map(item =>
      `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#F40009;flex-shrink:0;"></div>
        <span style="font-size:13px;font-weight:700;color:#27272a;text-transform:uppercase;">${item}</span>
      </div>`
    ).join("");

    const statusMap = {
      "EM ANÁLISE": { bg: "#fef3c7", color: "#92400e", icon: "⏳" },
      "APROVADA": { bg: "#d1fae5", color: "#065f46", icon: "✅" },
      "NÃO APROVADA": { bg: "#fee2e2", color: "#991b1b", icon: "🚫" },
      "RESERVA APROVADA": { bg: "#d1fae5", color: "#065f46", icon: "✅" },
      "RESERVA BAIXADA": { bg: "#d1fae5", color: "#065f46", icon: "✅" },
    };
    const st = statusMap[p.status] || statusMap["EM ANÁLISE"];

    const localText = p.local ? p.local.replace("DML_", "").replace("_", " ") : "";

    // Criar card invisível para renderizar
    const cardDiv = document.createElement("div");
    cardDiv.id = "exportCard";
    cardDiv.style.cssText = "position:fixed;top:-9999px;left:-9999px;z-index:-1;width:520px;font-family:'Space Grotesk',sans-serif;";
    cardDiv.innerHTML = `
      <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.1);border:2px solid #f4f4f5;">
        <!-- Header Vermelho -->
        <div style="background:linear-gradient(135deg,#F40009 0%,#dc0008 100%);padding:28px 28px 24px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
            ${avatarHTML}
            <div style="flex:1;min-width:0;">
              <div style="font-size:18px;font-weight:900;color:#fff;text-transform:uppercase;line-height:1.2;">${p.nome}</div>
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-top:5px;">${p.opc || "MATERIAL"}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Matrícula</div>
              <div style="font-size:16px;font-weight:900;color:#fff;">${p.mat}</div>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Equipe</div>
              <div style="font-size:15px;font-weight:900;color:#fff;">${p.equ}</div>
            </div>
            ${localText ? `<div style="flex:1;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Local</div>
              <div style="font-size:15px;font-weight:900;color:#fff;">${localText}</div>
            </div>` : ""}
          </div>
        </div>
        <!-- Body Branco -->
        <div style="padding:24px 28px 28px;">
          <div style="margin-bottom:18px;">
            <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px;">Protocolo</div>
            <div style="font-size:20px;font-weight:900;color:#18181b;letter-spacing:1px;">${p.id || "N/A"}</div>
          </div>
          <div style="height:2px;background:#f4f4f5;margin:18px 0;border-radius:1px;"></div>
          <div style="font-size:10px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Itens Solicitados</div>
          ${itensHTML}
          <div style="margin-top:20px;padding-top:16px;border-top:2px solid #f4f4f5;text-align:center;">
            <div style="font-size:9px;font-weight:700;color:#d4d4d8;text-transform:uppercase;letter-spacing:2px;">Sistema de Inventário</div>
            <div style="font-size:8px;color:#d4d4d8;margin-top:3px;">${p.dt || ""}</div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(cardDiv);

    // Guarda dados do pedido para o botão WhatsApp
    window._exportPedido = { ...p, _colab: colabMatch || null };

    Swal.fire({
      title: "",
      html: `
        <div style="font-family:'Space Grotesk',sans-serif;" class="text-center">
          <h3 class="text-base font-black text-zinc-900 uppercase tracking-wide mb-1">Pré-visualização</h3>
          <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4">Segure a imagem para salvar e enviar</p>
          <div id="exportPreview" class="flex justify-center"><div class="w-10 h-10 border-[3px] border-zinc-200 border-t-[#F40009] rounded-full animate-spin"></div></div>
          ${
            (colabMatch && colabMatch.numero)
              ? `<button id="btnWhatsAppExport" onclick="UI.enviarWhatsAppExport()" class="w-full mt-4 py-3.5 rounded-2xl font-black uppercase text-[12px] tracking-widest bg-[#25D366] hover:bg-[#1da851] text-white active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Enviar pelo WhatsApp
                </button>`
              : `<div class="w-full mt-4 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-zinc-50 text-zinc-400 border border-zinc-100 flex items-center justify-center gap-2" title="Número não cadastrado">
                  <i data-lucide="phone-off" class="w-4 h-4"></i>
                  Sem número cadastrado
                </div>`
          }
          <div class="grid grid-cols-3 gap-2 mt-2">
            <button onclick="Swal.close()" class="py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest text-zinc-600 hover:bg-zinc-200 transition-all bg-zinc-100 cursor-pointer border-none">Voltar</button>
            <button id="btnBaixarExport" onclick="UI.baixarImagemExport()" class="py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest text-zinc-700 hover:bg-zinc-200 transition-all bg-zinc-100 cursor-pointer border-none flex items-center justify-center gap-1.5">
              <i data-lucide="download" class="w-4 h-4"></i> Baixar
            </button>
            <button id="btnCopiarExport" onclick="UI.copiarImagemExport()" class="bg-[#F40009] text-white py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-[#900005] active:scale-[0.97] transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
              <i data-lucide="copy" class="w-4 h-4"></i> Copiar
            </button>
          </div>
          <p class="text-[9px] text-zinc-400 mt-3 uppercase tracking-widest font-bold">No celular: segure a imagem para salvar e enviar</p>
        </div>`,
      showConfirmButton: false,
      width: window.innerWidth < 640 ? "95%" : "520px",
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          html2canvas(cardDiv, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null }).then(canvas => {
            cardDiv.remove();
            canvas.style.cssText = "width:100%;max-width:380px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);";
            canvas.classList.add("img-preview");
            // Converte canvas em <img> para permitir long-press nativo no iOS
            const img = new Image();
            img.src = canvas.toDataURL("image/png");
            img.style.cssText = "width:100%;max-width:380px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);";
            img.className = "img-preview";
            img.alt = "Solicitação";
            const preview = document.getElementById("exportPreview");
            if (preview) { preview.innerHTML = ""; preview.appendChild(img); }
            // Salvar canvas para copiar depois
            window._exportCanvas = canvas;
          }).catch(() => { cardDiv.remove(); });
        }, 500);
      },
      willClose: () => { const el = document.getElementById("exportCard"); if (el) el.remove(); delete window._exportCanvas; delete window._exportPedido; }
    });
  },

  async copiarImagemExport() {
    const canvas = window._exportCanvas;
    if (!canvas) return;
    const btn = document.getElementById("btnCopiarExport");
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!navigator.clipboard || !window.ClipboardItem || !navigator.clipboard.write) {
        throw new Error("Clipboard API não suportada");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      if (btn) {
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Copiado!';
        btn.classList.remove("bg-[#F40009]", "hover:bg-[#900005]");
        btn.classList.add("bg-emerald-600");
      }
      setTimeout(() => Swal.close(), 1200);
    } catch {
      // Fallback: avisa o usuário para segurar a imagem (iOS Safari)
      if (btn) {
        btn.innerHTML = '<i data-lucide="hand" class="w-4 h-4"></i> Segure a Imagem';
        btn.classList.remove("bg-[#F40009]", "hover:bg-[#900005]");
        btn.classList.add("bg-zinc-900");
        if (window.lucide) window.lucide.createIcons();
      }
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i> Copiar';
          btn.classList.add("bg-[#F40009]", "hover:bg-[#900005]");
          btn.classList.remove("bg-zinc-900");
          if (window.lucide) window.lucide.createIcons();
        }
      }, 2200);
    }
  },

  async enviarWhatsAppExport() {
    const pedido = window._exportPedido;
    const canvas = window._exportCanvas;
    if (!pedido || !pedido._colab || !pedido._colab.numero) return;

    const btn = document.getElementById("btnWhatsAppExport");
    const labelOriginal = btn ? btn.innerHTML : "";

    // Formata o número em padrão internacional (Brasil = 55)
    let numero = String(pedido._colab.numero || "").replace(/\D/g, "");
    if (!numero) return;
    if (numero.length === 10 || numero.length === 11) numero = "55" + numero;

    // Copia imagem para clipboard antes de abrir o WhatsApp
    let copiou = false;
    if (canvas) {
      try {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (
          navigator.clipboard &&
          window.ClipboardItem &&
          navigator.clipboard.write
        ) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          copiou = true;
        }
      } catch {
        copiou = false;
      }
    }

    const primeiroNome = String(pedido.nome || "").split(" ")[0] || "";
    const protocolo = pedido.id ? `#${pedido.id}` : "";
    const status = pedido.status || "Atualizado";
    const texto =
      `Olá ${primeiroNome}! 👋\n\n` +
      `Seu pedido ${protocolo} teve o status atualizado para: *${status}*.\n\n` +
      (copiou
        ? `A pré-visualização foi copiada — é só colar (segurar e toque em Colar) e enviar 📎`
        : `Confira os detalhes em anexo.`);

    if (btn) {
      btn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Abrindo WhatsApp...';
      btn.disabled = true;
    }

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    setTimeout(() => {
      if (btn) {
        btn.innerHTML = labelOriginal;
        btn.disabled = false;
      }
    }, 1500);
  },

  baixarImagemExport() {
    const canvas = window._exportCanvas;
    if (!canvas) return;
    const btn = document.getElementById("btnBaixarExport");
    try {
      const link = document.createElement("a");
      link.download = "solicitacao.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (btn) {
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Baixado!';
        btn.classList.remove("bg-zinc-100", "hover:bg-zinc-200", "text-zinc-700");
        btn.classList.add("bg-emerald-600", "text-white");
      }
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = '<i data-lucide="download" class="w-4 h-4"></i> Baixar';
          btn.classList.add("bg-zinc-100", "hover:bg-zinc-200", "text-zinc-700");
          btn.classList.remove("bg-emerald-600", "text-white");
          if (window.lucide) window.lucide.createIcons();
        }
      }, 1800);
    } catch (e) {
      console.error("Erro ao baixar imagem:", e);
    }
  },

  // =========================================================
  // 8. POPUP INOVAÇÃO (SUGESTÕES)
  // =========================================================
  async abrirPopupIdeias() {
    const { value: formValues } = await Swal.fire({
      title: "INOVAÇÃO",
      width: window.innerWidth < 640 ? "95%" : "32em",
      html: `
                <div class="text-left mt-4 space-y-4">
                    <div class="relative">
                        <select id="swal-tipo" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-700 outline-none focus:border-red-500 transition-all appearance-none">
                            <option value="" disabled selected>O QUE VOCÊ PRECISA?</option>
                            <option value="Material em Falta">📦 Material em Falta</option>
                            <option value="Segurança/EPI">🛡️ Segurança / EPI</option>
                            <option value="Sugestão de Melhoria">💡 Sugestão de Melhoria</option>
                            <option value="Outros">📝 Outros</option>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                    
                    <div id="campos-especificos" class="hidden animate-entrada-suave space-y-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                        <input id="swal-material" type="text" class="w-full bg-white border border-red-200 rounded-xl p-3 text-sm font-bold outline-none text-gray-900 placeholder-red-300" placeholder="Qual o material?">
                        <input id="swal-codigo" type="text" class="w-full bg-white border border-red-200 rounded-xl p-3 text-sm font-bold outline-none text-gray-900 placeholder-red-300" placeholder="Código (Opcional)">
                        
                        <label class="flex items-center gap-3 p-2 bg-white/50 rounded-lg cursor-pointer">
                            <input type="checkbox" id="swal-variacoes" class="w-5 h-5 rounded text-red-600 focus:ring-red-500">
                            <span class="text-xs font-bold text-red-800 uppercase">Tem variações?</span>
                        </label>
                    </div>
                    
                    <textarea id="swal-texto" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 h-32 text-sm font-medium text-gray-700 outline-none focus:border-red-500 transition-all resize-none" placeholder="Descreva os detalhes aqui..."></textarea>
                </div>
            `,
      background: "#fff",
      color: "#000",
      showCancelButton: true,
      confirmButtonColor: "#F40009",
      confirmButtonText: "ENVIAR",
      cancelButtonText: "VOLTAR",
      reverseButtons: true,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
        const select = document.getElementById("swal-tipo");
        const campos = document.getElementById("campos-especificos");
        select.addEventListener("change", (e) => {
          const val = e.target.value;
          if (val === "Material em Falta" || val === "Segurança/EPI") {
            campos.classList.remove("hidden");
          } else {
            campos.classList.add("hidden");
          }
        });
      },
      preConfirm: () => {
        const tipo = document.getElementById("swal-tipo").value;
        const texto = document.getElementById("swal-texto").value;
        const material = document.getElementById("swal-material").value;
        const codigo = document.getElementById("swal-codigo").value;
        const variacoes = document.getElementById("swal-variacoes").checked;

        if (!tipo) {
          Swal.showValidationMessage("Selecione um tipo de solicitação.");
          return false;
        }
        if (
          (tipo === "Material em Falta" || tipo === "Segurança/EPI") &&
          !material
        ) {
          Swal.showValidationMessage("Por favor, informe qual o material.");
          return false;
        }
        if (!texto && !material) {
          Swal.showValidationMessage("Por favor, preencha os detalhes.");
          return false;
        }

        return {
          tipo,
          texto,
          material,
          codigo,
          variacoes,
          data: new Date().toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      },
    });

    if (formValues) {
      State.listaSugestoes.push(formValues);
      State.notificacoes++;

      if (window.Sistema && window.Sistema.persistirSugestoes) {
        window.Sistema.persistirSugestoes();
        window.Sistema.atualizarNotificacaoGestao();
      }

      Swal.fire({
        icon: "success",
        title: "Enviado!",
        text: "Obrigado pela sua contribuição.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
    }
  },

  verSugestoes() {
    if (State.listaSugestoes.length === 0) return;

    const lista = State.listaSugestoes
      .map(
        (s, index) => `
            <div class="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100 mb-3 relative group">
                <div class="flex justify-between mb-2">
                    <span class="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">${
                      s.tipo
                    }</span>
                    <button onclick="Sistema.deletarSugestao(${index})" class="text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                ${
                  s.material
                    ? `<p class="text-sm font-black text-zinc-900 mt-1">${
                        s.material
                      } ${
                        s.codigo
                          ? `<span class="text-gray-400 font-bold ml-1">#${s.codigo}</span>`
                          : ""
                      }</p>`
                    : ""
                }
                <p class="text-xs text-gray-600 mt-1 leading-relaxed">"${s.texto}"</p>
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
                    <i data-lucide="clock" class="w-3 h-3 text-gray-400"></i>
                    <span class="text-[10px] font-bold text-gray-400">${s.data}</span>
                </div>
            </div>
        `
      )
      .join("");

    Swal.fire({
      title: "Caixa de Entrada",
      width: window.innerWidth < 640 ? "95%" : "32em",
      html: `<div class="max-h-[60vh] overflow-y-auto pr-2 custom-scroll space-y-2 pt-2">${lista}</div>`,
      showConfirmButton: true,
      confirmButtonText: "FECHAR",
      confirmButtonColor: "#111827",
      didOpen: () => window.lucide.createIcons(),
      customClass: { popup: "swal2-popup-custom" },
    });
  },

  deletarSugestao(index) {
    Swal.fire({
      title: "Apagar?",
      text: "Isso não pode ser desfeito.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, apagar",
      cancelButtonText: "Cancelar",
      customClass: { popup: "swal2-popup-custom" },
    }).then((result) => {
      if (result.isConfirmed) {
        State.listaSugestoes.splice(index, 1);
        State.notificacoes = State.listaSugestoes.length;

        if (window.Sistema && window.Sistema.persistirSugestoes) {
          window.Sistema.persistirSugestoes();
          window.Sistema.atualizarNotificacaoGestao();
        }

        if (State.listaSugestoes.length > 0) {
          this.verSugestoes();
        } else {
          Swal.fire({
            icon: "success",
            title: "Limpo!",
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: "swal2-popup-custom" },
          });
        }
      }
    });
  },

  // =========================================================
  // 9. CONTENÇÃO LATERAL (VISUAL E LÓGICA) - OTIMIZADO 📱
  // =========================================================
  async abrirContencaoLateral(resetMode = true) {
    if (resetMode) {
      this.modoAbastecimento = false;
    }

    Swal.fire({
      html: `
        <div class="flex flex-col items-center justify-center py-6">
          <div class="relative w-14 h-14 mb-5">
            <div class="absolute inset-0 rounded-full border-[3px] border-zinc-100"></div>
            <div class="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#F40009] animate-spin"></div>
          </div>
          <p class="text-sm font-black uppercase tracking-wider text-zinc-900">Carregando Estoque</p>
          <p class="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Aguarde alguns segundos</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      background: "rgba(255, 255, 255, 0.98)",
      color: "#111827",
      customClass: { popup: "swal2-popup-custom" },
    });

    const itens = await Api.lerContencaoLateral();
    this.dadosContencao = itens; // Salva para filtro local
    this.renderizarCriticosContencao(itens);

    if (!itens || itens.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Vazio",
        text: "Nenhum item na contenção.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    const larguraPopup = window.innerWidth < 768 ? "95%" : "650px";
    const estiloModo = this.modoAbastecimento
      ? "bg-green-50 border-green-100"
      : "bg-gray-50 border-gray-100";
    const textoModo = this.modoAbastecimento
      ? "MODO ABASTECIMENTO (Adicionar)"
      : "Controle de Estoque (Retirar)";

    const totalItens = this.dadosContencao.length;
    const totalCriticos = this.dadosContencao.filter(
      (i) => i.qtd > 0 && i.qtd <= 2
    ).length;

    Swal.fire({
      title: "Contenção Lateral",
      width: larguraPopup,
      html: `
            <div class="flex items-center justify-center gap-4 -mt-2 mb-4 text-[10px] font-black uppercase tracking-widest">
                <div class="flex items-center gap-1.5 text-zinc-500">
                    <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                    <span>${totalItens} ${totalItens === 1 ? "Item" : "Itens"}</span>
                </div>
                ${
                  totalCriticos > 0
                    ? `<div class="flex items-center gap-1.5 text-red-500"><span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span><span>${totalCriticos} Crítico${totalCriticos === 1 ? "" : "s"}</span></div>`
                    : ""
                }
            </div>
            <div class="flex items-center justify-between mb-4 gap-2">
                 <div class="relative group flex-1">
                    <input id="inputBuscaContencao" type="text" placeholder="Filtrar item..." class="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-3 pl-10 text-sm font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:bg-white transition-all placeholder-zinc-400">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#F40009] transition-colors">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                 </div>
                 <button onclick="UI.abrirCadastroContencao()" class="h-12 px-4 rounded-2xl bg-zinc-900 text-white flex items-center gap-2 hover:bg-[#F40009] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm flex-shrink-0" title="Adicionar Produto">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span class="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Adicionar Produto</span>
                 </button>
            </div>
            <div id="listaContencao" class="${estiloModo} p-2 sm:p-4 rounded-[2rem] max-h-[60vh] overflow-y-auto custom-scroll border-2 transition-colors">
                ${this.renderizarListaContencao(this.dadosContencao)}
            </div>
            <p id="legendaContencao" class="text-[10px] ${
              this.modoAbastecimento ? "text-green-600" : "text-gray-400"
            } mt-4 italic uppercase font-bold animate-pulse">${textoModo}</p>
        `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
        window.lucide.createIcons();
        const input = document.getElementById("inputBuscaContencao");
        if (input) {
          input.focus();
          input.addEventListener("input", (e) =>
            this.filtrarContencao(e.target.value)
          );
        }
      },
    });
  },

  async alternarModoAbastecimento() {
    this.modoAbastecimento = !this.modoAbastecimento;
    this.abrirContencaoLateral(false);

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: "success",
      title: this.modoAbastecimento
        ? "Modo Abastecimento Ativado"
        : "Modo Abastecimento Desativado",
    });
  },

  async abrirCadastroContencao() {
    const escolha = await Swal.fire({
      title: "Adicionar Produto",
      html: `
        <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 -mt-2 mb-5">Selecione como deseja adicionar</p>
        <div class="grid grid-cols-1 gap-3">
          <button id="btnAddExistente" class="group w-full p-4 bg-white border-2 border-zinc-200 rounded-2xl flex items-center gap-3.5 hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer active:scale-[0.97] text-left">
            <div class="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#F40009] group-hover:scale-110 transition-all">
              <i data-lucide="layers" class="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-black uppercase text-zinc-900 group-hover:text-[#F40009] transition-colors">Somar em Existente</p>
              <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">Acrescentar quantidade a um item</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-[#F40009] transition-colors"></i>
          </button>
          <button id="btnAddNovo" class="group w-full p-4 bg-white border-2 border-zinc-200 rounded-2xl flex items-center gap-3.5 hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer active:scale-[0.97] text-left">
            <div class="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#F40009] group-hover:scale-110 transition-all">
              <i data-lucide="plus-circle" class="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-black uppercase text-zinc-900 group-hover:text-[#F40009] transition-colors">Novo Produto</p>
              <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">Cadastrar um item inédito</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-[#F40009] transition-colors"></i>
          </button>
        </div>
        <button id="btnVoltarContencao" class="mt-5 w-full py-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>Voltar</span>
        </button>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      showCloseButton: true,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
        window.lucide.createIcons();
        document
          .getElementById("btnAddExistente")
          .addEventListener("click", () => {
            Swal.close();
            this.abrirCadastroContencaoExistente();
          });
        document.getElementById("btnAddNovo").addEventListener("click", () => {
          Swal.close();
          this.abrirCadastroContencaoNovo();
        });
        document
          .getElementById("btnVoltarContencao")
          .addEventListener("click", () => {
            Swal.close();
            this.abrirContencaoLateral(false);
          });
      },
    });

    if (
      escolha.isDismissed &&
      (escolha.dismiss === Swal.DismissReason.cancel ||
        escolha.dismiss === Swal.DismissReason.close ||
        escolha.dismiss === Swal.DismissReason.backdrop)
    ) {
      this.abrirContencaoLateral(false);
    }
    return escolha;
  },

  async abrirCadastroContencaoExistente(scrollTop = null) {
    if (!this.dadosContencao || this.dadosContencao.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sem itens",
        text: "Nenhum item encontrado para atualizar.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    const lista = this.dadosContencao
      .map((item, index) => {
        const foto =
          item.foto ||
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200";
        const tam = item.tamanho ? item.tamanho : "UNICO";
        return `
          <button class="contencao-item w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-red-400 hover:bg-red-50 transition-all text-left" data-index="${index}">
            <img src="${foto}" class="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black uppercase text-zinc-900 leading-tight line-clamp-2">${item.material}</p>
              <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tam: ${tam}</p>
            </div>
            <span class="text-[9px] font-black px-2 py-1 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200">Estoque: ${item.qtd}</span>
          </button>
        `;
      })
      .join("");

    const res = await Swal.fire({
      title: "Selecione o Produto",
      html: `
        <div id="listaContencaoSelecao" class="bg-gray-50 p-3 rounded-2xl max-h-[60vh] overflow-y-auto custom-scroll space-y-2">
          ${lista}
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Voltar",
      showCloseButton: true,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
        const scroller = document.getElementById("listaContencaoSelecao");
        if (scroller) {
          scroller.scrollTop =
            scrollTop !== null ? scrollTop : this.contencaoListaScroll;
        }
        const els = document.querySelectorAll(".contencao-item");
        els.forEach((el) => {
          el.addEventListener("click", () => {
            if (scroller) this.contencaoListaScroll = scroller.scrollTop;
            const idx = parseInt(el.getAttribute("data-index"), 10);
            const item = this.dadosContencao[idx];
            Swal.close();
            this.abrirQuantidadeParaExistente(item);
          });
        });
      },
    });

    if (res.isDismissed && res.dismiss === Swal.DismissReason.cancel) {
      this.abrirCadastroContencao();
    }
  },

  async abrirQuantidadeParaExistente(item) {
    const foto =
      item.foto ||
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200";
    const tam = item.tamanho ? item.tamanho : "UNICO";

    const result = await Swal.fire({
      title: "Adicionar Quantidade",
      html: `
        <div class="flex items-center gap-3 mb-4">
          <img src="${foto}" class="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm">
          <div class="text-left">
            <p class="text-xs font-black uppercase text-zinc-900 leading-tight">${item.material}</p>
            <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tam: ${tam}</p>
            <p class="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Estoque atual: ${item.qtd}</p>
          </div>
        </div>
        <div class="text-left">
          <label class="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Quantidade para adicionar*</label>
          <input id="contencao-qtd-existente" type="number" min="1" value="1" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-red-500 transition-all">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      cancelButtonText: "Voltar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton: "bg-[#F40009] hover:bg-[#900005] text-white font-black uppercase text-[11px] tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md",
        cancelButton: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black uppercase text-[11px] tracking-widest px-6 py-3 rounded-2xl transition-all mr-2",
        actions: "gap-0 mt-2",
      },
      preConfirm: () => {
        const qtdStr = document.getElementById("contencao-qtd-existente").value;
        const quantidade = parseInt(qtdStr, 10);
        if (!quantidade || quantidade < 1) {
          Swal.showValidationMessage("Quantidade invalida.");
          return false;
        }
        return {
          material: item.material,
          tamanho: item.tamanho || "",
          foto: item.foto || "",
          quantidade,
          forcarExistente: true,
        };
      },
    });

    if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      this.abrirCadastroContencaoExistente(this.contencaoListaScroll);
      return;
    }
    if (!result.value) return;
    await this.processarCadastroContencao(result.value);
  },
  async abrirCadastroContencaoNovo() {
    const result = await Swal.fire({
      title: "Novo Produto",
      html: `
        <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 -mt-2 mb-5">Preencha os dados do item</p>
        <div class="space-y-3 text-left">
          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Material*</label>
            <input id="contencao-material" class="mt-1.5 w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-3.5 text-sm font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:bg-white transition-all uppercase placeholder-zinc-300" placeholder="Ex: Bota de Segurança">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Tamanho (opcional)</label>
            <input id="contencao-tamanho" class="mt-1.5 w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-3.5 text-sm font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:bg-white transition-all uppercase placeholder-zinc-300" placeholder="Ex: 38 ou P">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Quantidade*</label>
            <input id="contencao-qtd" type="number" min="1" value="1" class="mt-1.5 w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-3.5 text-sm font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:bg-white transition-all">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      cancelButtonText: "Voltar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton: "bg-[#F40009] hover:bg-[#900005] text-white font-black uppercase text-[11px] tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md",
        cancelButton: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black uppercase text-[11px] tracking-widest px-6 py-3 rounded-2xl transition-all mr-2",
        actions: "gap-0 mt-2",
      },
      preConfirm: () => {
        const material = document
          .getElementById("contencao-material")
          .value.trim();
        const tamanho = document
          .getElementById("contencao-tamanho")
          .value.trim();
        const qtdStr = document.getElementById("contencao-qtd").value;
        const quantidade = parseInt(qtdStr, 10);

        if (!material) {
          Swal.showValidationMessage("Informe o material.");
          return false;
        }
        if (!quantidade || quantidade < 1) {
          Swal.showValidationMessage("Quantidade invalida.");
          return false;
        }
        return { material, tamanho, quantidade };
      },
    });

    if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      this.abrirCadastroContencao();
      return;
    }
    if (!result.value) return;
    await this.processarCadastroContencao(result.value);
  },

  async processarCadastroContencao(formValues) {
    Swal.fire({
      title: "Processando...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      background: "transparent",
      backdrop: "rgba(0,0,0,0.5)",
      showConfirmButton: false,
      customClass: { popup: "swal2-popup-custom" },
    });

    const payload = {
      material: formValues.material,
      tamanho: formValues.tamanho,
      foto: "",
      quantidade: formValues.quantidade,
      forcarExistente: formValues.forcarExistente === true,
    };

    const res = await Api.adicionarOuAtualizarContencao(payload);

    if (res.success) {
      Swal.close();
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "success",
        title:
          res.action === "created"
            ? "Produto adicionado!"
            : "Quantidade atualizada!",
      });

      this.abrirContencaoLateral(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: res.msg || "Falha na conexao.",
        customClass: { popup: "swal2-popup-custom" },
      });
    }
  },

  async alternarAlertaContencao(material, tamanho, atual) {
    const novo = !atual;
    const res = await Api.atualizarAlertaContencao(material, tamanho, novo);
    if (res.success) {
      const item = this.dadosContencao.find(
        (i) =>
          String(i.material) === String(material) &&
          String(i.tamanho || "") === String(tamanho || "")
      );
      if (item) item.alerta = novo;
      this.renderizarCriticosContencao();
      this.abrirContencaoLateral(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: res.msg || "Falha na conexao.",
        customClass: { popup: "swal2-popup-custom" },
      });
    }
  },

  renderizarCriticosContencao(lista = null) {
    const container = document.getElementById("widgetContencaoCritica");
    if (!container) return;

    const itens = lista || this.dadosContencao || [];
    const criticos = itens.filter((i) => {
      const qtd = parseInt(i.qtd, 10);
      return i.alerta === true && !isNaN(qtd) && qtd <= 3;
    });

    if (criticos.length === 0) {
      container.innerHTML =
        '<p class="text-xs text-gray-400">Nenhum item crÃ­tico.</p>';
      return;
    }

    container.innerHTML = criticos
      .map((item) => {
        const qtd = parseInt(item.qtd, 10);
        const nome = item.material || "Item";
        const fotoUrl =
          item.foto ||
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200";
        const tam = item.tamanho ? `Tam: ${item.tamanho}` : "";
        return `
          <div class="flex items-center justify-between p-2 rounded-xl border mb-2 bg-orange-50/50 border-orange-100 hover:bg-orange-100 transition-all">
            <div class="flex items-center gap-2">
              <div class="w-1 h-8 bg-orange-300 rounded-full transition-colors"></div>
              <img src="${fotoUrl}" class="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0">
              <div class="text-left">
                <p class="text-[10px] font-black uppercase text-gray-900 leading-none mb-1">${nome}</p>
                ${tam ? `<p class="text-[9px] font-bold text-gray-400 uppercase">${tam}</p>` : ""}
                <p class="text-[9px] font-bold text-orange-600 uppercase">Restam: ${qtd} un</p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  },


  filtrarContencao(termo) {
    const termoLimpo = termo.toUpperCase();
    const filtrados = this.dadosContencao.filter((item) => {
      const mat = item.material ? String(item.material).toUpperCase() : "";
      const tam = item.tamanho ? String(item.tamanho).toUpperCase() : "";
      return mat.includes(termoLimpo) || tam.includes(termoLimpo);
    });
    const listaEl = document.getElementById("listaContencao");
    if (listaEl) {
      listaEl.innerHTML = this.renderizarListaContencao(filtrados);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderizarListaContencao(lista) {
    if (lista.length === 0)
      return '<p class="text-center text-gray-400 py-4 text-xs font-bold uppercase">Nenhum item encontrado</p>';

    return lista
      .map((item, index) => {
        const isLow = item.qtd <= 2;
        let corQtd, btnClass, btnText;

        if (this.modoAbastecimento) {
          corQtd = "bg-green-100 text-green-700 border-green-200";
          btnClass =
            "bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95";
          btnText = "ADICIONAR";
        } else {
          corQtd = isLow
            ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
            : "bg-emerald-50 text-emerald-600 border-emerald-200";
          btnClass =
            item.qtd <= 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-zinc-900 text-white hover:bg-red-600 shadow-md active:scale-95";
          btnText = item.qtd <= 0 ? "ESGOTADO" : "RETIRAR";
        }

        const fotoUrl =
          item.foto ||
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200";
        const idUnico = `item-${index}`;
        const isDisabled = !this.modoAbastecimento && item.qtd <= 0;

        const badgeCritico =
          !this.modoAbastecimento && isLow && item.qtd > 0
            ? '<span class="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-md bg-red-500 text-white uppercase tracking-widest animate-pulse"><span class="w-1 h-1 rounded-full bg-white"></span>Crítico</span>'
            : "";

        return `
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-white border border-zinc-100 rounded-3xl shadow-sm mb-3 gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-red-200 hover:-translate-y-0.5 duration-200">
                <div class="flex items-center gap-3">
                    <button onclick="UI.alternarAlertaContencao('${item.material}', '${item.tamanho || ""}', ${item.alerta ? "true" : "false"})" class="w-8 h-8 rounded-xl flex items-center justify-center border ${
          item.alerta
            ? "bg-red-100 border-red-200 text-red-600"
            : "bg-white border-zinc-100 text-zinc-300 hover:text-red-400 hover:border-red-200"
        } shadow-sm transition-all flex-shrink-0" title="Alerta de crítico">
                        <i data-lucide="bell" class="w-4 h-4"></i>
                    </button>
                    <img src="${fotoUrl}" class="w-14 h-14 rounded-2xl object-cover border border-zinc-100 shadow-sm flex-shrink-0">
                    <div class="text-left flex-1 min-w-0">
                        <p class="text-xs font-black uppercase text-zinc-900 leading-tight mb-1 line-clamp-2">${
                          item.material
                        }</p>
                        <div class="flex items-center gap-1.5 flex-wrap">
                          ${
                            item.tamanho
                              ? `<span class="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-100 inline-block px-2 py-0.5 rounded-full">${item.tamanho}</span>`
                              : ""
                          }
                          ${badgeCritico}
                        </div>
                    </div>
                </div>

                <div class="flex flex-row items-center justify-between gap-2 border-t sm:border-t-0 border-zinc-50 pt-2 sm:pt-0">
                    <div class="flex items-center gap-2 bg-zinc-50 rounded-xl p-1 border border-zinc-100">
                        <button onclick="UI.ajustarQtd('${idUnico}', -1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-zinc-600 hover:text-[#F40009] font-bold transition-colors disabled:opacity-50" ${
          isDisabled ? "disabled" : ""
        }>−</button>
                        <span id="label-${idUnico}" class="text-xs font-black w-6 text-center text-zinc-900">1</span>
                        <button onclick="UI.ajustarQtd('${idUnico}', 1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-zinc-600 hover:text-emerald-600 font-bold transition-colors" ${
          isDisabled ? "disabled" : ""
        }>+</button>
                    </div>

                    <div class="flex flex-col items-end gap-1.5">
                        <span class="text-[9px] font-black px-2 py-0.5 rounded-md border ${corQtd}">Estoque: ${
          item.qtd
        }</span>
                        <button
                            onclick="UI.baixarEstoque('${item.material}', '${
          item.tamanho
        }', parseInt(document.getElementById('label-${idUnico}').innerText))"
                            class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${btnClass}"
                            ${isDisabled ? "disabled" : ""}
                        >
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;
      })
      .join("");
  },

  ajustarQtd(id, delta) {
    const el = document.getElementById(`label-${id}`);
    let val = parseInt(el.innerText);
    val += delta;
    if (val < 1) val = 1;
    el.innerText = val;
  },

  async baixarEstoque(material, tamanho, qtd) {
    const isAdding = this.modoAbastecimento;
    const actionText = isAdding ? "ADICIONAR" : "RETIRAR";
    const confirmText = isAdding ? "Sim, adicionar" : "Sim, retirar";
    const color = isAdding ? "#16a34a" : "#F40009";

    const finalQtd = isAdding ? -qtd : qtd;

    const confirm = await Swal.fire({
      title: `${actionText} ${qtd} Item(ns)?`,
      html: `Confirmar ação para:<br><b>${material}</b>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: color,
      confirmButtonText: confirmText,
      cancelButtonText: "NÃO",
      customClass: { popup: "swal2-popup-custom" },
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Processando...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      background: "transparent",
      backdrop: "rgba(0,0,0,0.5)",
      showConfirmButton: false,
      customClass: { popup: "swal2-popup-custom" },
    });

    const res = await Api.baixarEstoqueLateral(material, tamanho, finalQtd);

    if (res.success) {
      Swal.close();

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      let undoHtml = "";
      if (!isAdding) {
        undoHtml = `<button onclick="UI.desfazerBaixa('${material}', '${tamanho}', ${finalQtd})" class="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded border border-red-200 mt-2 hover:bg-red-100 transition-colors">DESFAZER AÇÃO</button>`;
      }

      Toast.fire({
        icon: "success",
        title: isAdding ? "Estoque abastecido!" : "Baixa realizada!",
        html: undoHtml,
      });

      this.abrirContencaoLateral(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: res.msg || "Falha na conexão.",
        customClass: { popup: "swal2-popup-custom" },
      });
    }
  },

  async desfazerBaixa(material, tamanho, qtdOriginal) {
    Swal.fire({
      title: "Desfazendo...",
      didOpen: () => Swal.showLoading(),
      background: "transparent",
      backdrop: "rgba(0,0,0,0.5)",
      showConfirmButton: false,
      customClass: { popup: "swal2-popup-custom" },
    });

    const res = await Api.baixarEstoqueLateral(material, tamanho, -qtdOriginal);

    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Ação Desfeita!",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-popup-custom" },
      }).then(async () => {
        this.abrirContencaoLateral(false);
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Erro ao desfazer",
        text: res.msg,
        customClass: { popup: "swal2-popup-custom" },
      });
    }
  },
};
