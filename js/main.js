// =========================================================
// PONTO DE ENTRADA PRINCIPAL (MAIN)
// =========================================================

// 1. Importa os Módulos
import Auth from "./core/auth.js";
import { State } from "./core/state.js";
import { Navigation } from "./modules/navigation.js";
import { Cart } from "./modules/cart.js";
import { Search } from "./modules/search.js";
import { UI } from "./modules/ui.js";
import { Api } from "./services/api.js";
import { PublicForm } from "./modules/public_form.js";

// IMPORTANTE: Expor a UI globalmente para os botões do Popup de Contenção funcionarem
window.UI = UI;

// 2. Cria a Ponte Global (Para o HTML conseguir chamar as funções)
window.Sistema = {
  // --- Autenticação e Inicialização ---
  init: () => {
    // Inicializa ícones
    if (window.lucide) window.lucide.createIcons();

    // --- ATIVA OS LISTENERS DE BUSCA (IMPORTANTE!) ---
    UI.init();

    // Ouve login do Firebase
    Auth.init((user) => {
      State.usuarioFirebase = user;
      console.log("Sistema pronto. Usuário:", user ? user.uid : "Anônimo");

      // Se não estiver logado, já baixa os dados para o rastreio funcionar rápido
      if (!user) {
        Api.sincronizarPedidos();
      }
    });

    // 🆕 DETECTOR DE CAPS LOCK / SHIFT E TECLA ENTER
    // Manter login ao recarregar
    if (localStorage.getItem("admin_autenticado") === "1") {
      const tela = document.getElementById("telaLogin");
      if (tela) tela.style.display = "none";
      Navigation.iniciarIntro();
    }

    const inputSenha = document.getElementById("senhaAcesso");
    if (inputSenha) {
      // Verifica ao digitar (keydown/keyup) e ao clicar no campo para CapsLock
      ["keyup", "keydown", "mousedown"].forEach((evento) => {
        inputSenha.addEventListener(evento, (e) => {
          const indicador = document.getElementById("indicadorCaps");
          // Se CapsLock estiver ativo OU Shift pressionado (opcional)
          const capsAtivo =
            e.getModifierState && e.getModifierState("CapsLock");

          if (capsAtivo) {
            indicador.classList.remove("hidden");
          } else {
            indicador.classList.add("hidden");
          }
        });
      });

      // 🆕 SUPORTE PARA TECLA ENTER (LOGIN)
      inputSenha.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Evita comportamento padrão se houver form
          window.Sistema.autenticar(e);
        }
      });
    }

    // Listeners de Conexão (Online/Offline)
    window.addEventListener("online", () => atualizarStatusRede(true));
    window.addEventListener("offline", () => atualizarStatusRede(false));
    atualizarStatusRede(navigator.onLine);
  },

  // Função chamada pelo formulário de login
  autenticar: async (e) => {
    if (e) e.preventDefault();
    const senhaInput = document.getElementById("senhaAcesso");
    const caixaLogin = document.getElementById("caixaLogin");

    // Chama o Auth.js para validar o hash
    const valido = await Auth.validarSenha(senhaInput.value);

    if (valido) {
      // Animação de saída do login
      localStorage.setItem("admin_autenticado", "1");
      document.getElementById("telaLogin").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("telaLogin").style.display = "none";
        Navigation.iniciarIntro();
      }, 800);
    } else {
      // Animação de erro (tremer)
      caixaLogin.classList.remove("animate-tremer");
      void caixaLogin.offsetWidth; // Força reflow
      caixaLogin.classList.add("animate-tremer");

      Swal.fire({
        title: "",
        html: `
          <div class="flex flex-col items-center py-2">
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-red-100">
              <i data-lucide="lock" class="w-6 h-6 text-[#F40009]"></i>
            </div>
            <h3 class="text-base font-black text-zinc-900 uppercase tracking-wide">Acesso Negado</h3>
            <p class="text-[11px] text-zinc-400 font-bold mt-1">Chave incorreta. Tente novamente.</p>
          </div>`,
        confirmButtonColor: "#F40009",
        confirmButtonText: "TENTAR NOVAMENTE",
        customClass: { popup: "swal2-popup-custom" },
        didOpen: () => { if (window.lucide) window.lucide.createIcons(); }
      });
    }
  },

  // 🆕 ALTERNAR VER SENHA (OLHO)
  alternarVerSenha: () => {
    const input = document.getElementById("senhaAcesso");
    const icone = document.getElementById("iconeOlho");
    if (input.type === "password") {
      input.type = "text";
      icone.setAttribute("data-lucide", "eye-off");
    } else {
      input.type = "password";
      icone.setAttribute("data-lucide", "eye");
    }
    if (window.lucide) window.lucide.createIcons();
  },

  // --- Navegação ---
  pularIntro: () => Navigation.pularIntro(),
  encerrar: () => Navigation.encerrar(),
  home: () => Navigation.irParaHome(),
  abrirMenu: (m) => Navigation.abrirMenu(m),
  selecionarSetor: (cat, titulo) => Navigation.selecionarSetor(cat, titulo),

  // --- Busca ---
  processarBuscaSpotlight: (val) => Search.processar(val),

  // --- Carrinho ---
  alternarCarrinho: (m) => Navigation.alternarCarrinho(m),
  adicionarAoCarrinho: (n, v, c) => Cart.adicionar(n, v, c),
  alterarQuantidadeCarrinho: (id, d) => Cart.alterarQuantidade(id, d),
  removerDoCarrinho: (id) => Cart.remover(id),
  enviarOrdem: () => Cart.enviarOrdem(),

  // --- Interface / UI / SweetAlerts ---
  abrirDetalhesMaterial: (n, v, c, f, s) =>
    UI.abrirDetalhesMaterial(n, v, c, f, s),
  abrirVariacoesMaterial: (n) => UI.abrirVariacoesMaterial(n),
  abrirDetalhesPedido: (p) => UI.abrirDetalhesPedido(p),
  copiarCodigo: (c) => UI.copiarCodigo(c),
  notificarWhatsApp: (n, m) => UI.notificarWhatsApp(n, m),
  abrirFormularioSolicitacao: () => UI.abrirFormularioSolicitacao(),

  // --- Gestão e Admin ---
  abrirMenuGestao: () => UI.abrirMenuGestao(),
  abrirPopupIdeias: () => UI.abrirPopupIdeias(),
  verSugestoes: () => UI.verSugestoes(),
  deletarSugestao: (i) => UI.deletarSugestao(i),
  solicitarAcessoAdmin: () => UI.solicitarAcessoAdmin(),

  // --- Contenção Lateral (NOVO) ---
  abrirContencaoLateral: () => UI.abrirContencaoLateral(),
  baixarEstoque: (m, t) => UI.baixarEstoque(m, t),

  // =================================================================
  // ATUALIZAÇÃO DE STATUS
  // =================================================================
  atualizarStatus: async (id, novoStatus, codigoSap = "") => {
    if (!State._statusUpdateToken) State._statusUpdateToken = {};
    const token = `${Date.now()}-${Math.random()}`;
    State._statusUpdateToken[id] = token;

    const getMsgClass = (status) => {
      const upper = String(status || "").toUpperCase();
      const key = upper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (key.includes("APROVADA") || key.includes("BAIXADA")) {
        return "text-[10px] text-emerald-600 mt-2 pl-2 h-4 transition-all font-bold";
      }
      if (key.includes("ANALISE") || key.includes("AGUARDANDO")) {
        return "text-[10px] text-amber-600 mt-2 pl-2 h-4 transition-all font-bold";
      }
      if (key.includes("NAO APROV") || key.includes("ERRO") || key.includes("FALTA")) {
        return "text-[10px] text-red-600 mt-2 pl-2 h-4 transition-all font-bold";
      }
      return "text-[10px] text-blue-500 mt-2 pl-2 h-4 transition-all font-bold";
    };

    // 1. Feedback Visual Imediato
    const msg = document.getElementById("msgStatus");
    if (msg) {
      msg.innerText = "Salvando na planilha...";
      msg.className =
        "text-[10px] text-blue-500 mt-2 pl-2 h-4 transition-all animate-pulse font-bold";
    }

    // 2. Chama a API
    const sucesso = await Api.atualizarStatus(id, novoStatus, codigoSap);
    if (State._statusUpdateToken[id] !== token) return;

    // 3. Atualiza Visual Final
    if (msg) {
      if (sucesso) {
        msg.innerText = "Status atualizado com sucesso!";
        msg.className = getMsgClass(novoStatus);

        // Atualiza a memória local para não precisar recarregar tudo
        const pedido = State.pedidos.find((p) => p.id == id);
        if (pedido) {
          pedido.status = novoStatus;
          if (codigoSap !== undefined) pedido.sap = codigoSap;
        }
        // Atualiza a cor do card na lista imediatamente
        UI.atualizarCorCardLista(id, novoStatus);
      } else {
        msg.innerText = "Erro de conexão. Tente novamente.";
        msg.className =
          "text-[10px] text-red-600 mt-2 pl-2 h-4 transition-all font-bold";
      }
    }
  },

  atualizarItens: async (id, novosItens) => {
    await Api.atualizarItens(id, novosItens);
  },

  // --- RASTREAMENTO PÚBLICO (CORRIGIDO PARA BUSCAR NO ARQUIVO MORTO) ---
  abrirRastreio: () => UI.abrirPopupRastreio(),

  processarRastreio: async (termo) => {
    Swal.fire({
      title: "",
      html: `
        <div class="flex flex-col items-center py-2">
          <div class="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <div class="w-6 h-6 border-[3px] border-zinc-600 border-t-white rounded-full animate-spin"></div>
          </div>
          <h3 class="text-base font-black text-zinc-900 uppercase tracking-wide">Buscando...</h3>
          <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-1">Consultando histórico no servidor</p>
        </div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: { popup: "swal2-popup-custom" },
    });

    const termoLimpo = termo.trim().toUpperCase();

    // 1. BUSCA POR ID (Mantém local se for rápido, ou busca remota se não achar)
    if (termoLimpo.startsWith("#")) {
      // Garante que temos os dados recentes
      if (!State.pedidos || State.pedidos.length === 0) {
        await Api.sincronizarPedidos(true);
      }

      const dados = State.pedidos || [];
      const pedido = dados.find((p) => p.id === termoLimpo);

      if (pedido) {
        UI.mostrarResultadoUnico(pedido);
      } else {
        Swal.fire({
          title: "",
          html: `
            <div class="flex flex-col items-center py-2">
              <div class="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 border-2 border-zinc-200">
                <i data-lucide="search-x" class="w-6 h-6 text-zinc-400"></i>
              </div>
              <h3 class="text-base font-black text-zinc-900 uppercase tracking-wide">Não Encontrado</h3>
              <p class="text-[11px] text-zinc-400 font-bold mt-1">Nenhum pedido recente com este ID.</p>
            </div>`,
          confirmButtonColor: "#F40009",
          confirmButtonText: "ENTENDI",
          customClass: { popup: "swal2-popup-custom" },
          didOpen: () => { if (window.lucide) window.lucide.createIcons(); }
        });
      }
    }
    // 2. BUSCA POR MATRÍCULA
    else {
      try {
        // Chama a nova função da API que busca tudo na nuvem
        const historicoUnificado = await Api.buscarHistoricoUnificado(
          termoLimpo
        );

        // UI.mostrarHistoricoUsuario já sabe lidar com lista vazia (mostra aviso)
        // e sabe lidar com dados (monta a timeline)
        UI.mostrarHistoricoUsuario(historicoUnificado);
      } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        UI.mostrarHistoricoUsuario([]); // Mostra tela de "nada encontrado" em caso de erro
      }
    }
  },

  // --- API e Dados ---
  sincronizarPedidos: (tudo) => {
    if (tudo) {
      const campoInicio = document.getElementById("dataInicio");
      const campoFim = document.getElementById("dataFim");
      const campoBusca = document.getElementById("inputBuscaPedidos");

      if (campoInicio) campoInicio.value = "";
      if (campoFim) campoFim.value = "";
      if (campoBusca) campoBusca.value = "";

      const painel = document.getElementById("painelFiltros");
      if (painel) painel.classList.remove("animate-tremer");
    }
    return Api.sincronizarPedidos(tudo);
  },

  preCarregarTudo: () => Api.preCarregarTudo(),

  // Filtro de Datas
  aplicarFiltros: () => {
    const s = document.getElementById("dataInicio").value;
    const e = document.getElementById("dataFim").value;
    const painel = document.getElementById("painelFiltros");

    if (!s || !e) return;

    const [anoS, mesS, diaS] = s.split("-");
    const dataInicio = new Date(anoS, mesS - 1, diaS, 0, 0, 0, 0);

    const [anoE, mesE, diaE] = e.split("-");
    const dataFim = new Date(anoE, mesE - 1, diaE, 23, 59, 59, 999);

    if (dataInicio > dataFim) {
      painel.classList.remove("animate-tremer");
      void painel.offsetWidth;
      painel.classList.add("animate-tremer");
      Swal.fire({
        icon: "warning",
        title: "Intervalo Inválido",
        text: "A data inicial não pode ser superior à data final!",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    const filtered = State.pedidos.filter((p) => {
      if (!p.dataObj) return false;
      return p.dataObj >= dataInicio && p.dataObj <= dataFim;
    });

    const container = document.getElementById("gradeAtivos");
    container.innerHTML = "";

    if (filtered.length === 0) {
      document.getElementById("vazio").classList.remove("hidden");
      const txt = document.querySelector("#vazio p");
      if (txt) txt.innerText = "Nenhum pedido localizado neste período.";
      return;
    }
    document.getElementById("vazio").classList.add("hidden");

    filtered.forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "order-card rounded-[3rem] p-12 flex flex-col animate-entrada-suave cursor-pointer bg-white shadow-xl text-left text-zinc-900 hover:scale-[1.02] transition-transform";
      card.onclick = () => UI.abrirDetalhesPedido(p);

      const isEPI =
        p.opc.toUpperCase().includes("EPI") ||
        p.opc.toUpperCase().includes("UNIFORME");
      const color = isEPI
        ? "text-blue-600 bg-blue-50 border-blue-100"
        : "text-emerald-600 bg-emerald-50 border-emerald-100";
      const urlAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        p.nome
      )}&background=F40009&color=fff&bold=true&size=128`;
      const horaFormatada = p.dt.includes(" ")
        ? p.dt.split(" ")[1].substring(0, 5)
        : "--:--";
      const dataFormatada = p.dt.split(" ")[0];

      card.innerHTML = `
                <div class="flex justify-between items-start mb-10 text-left">
                    <img src="${urlAvatar}" class="avatar-colaborador" alt="Perfil">
                    <span class="badge-categoria ${color} border">${p.opc}</span>
                </div>
                <h3 class="text-2xl font-black uppercase text-gray-900 mb-2 leading-tight text-left text-zinc-900">${p.nome}</h3>
                <p class="text-[11px] font-black uppercase tracking-[0.2em] text-red-600 mb-6 italic text-left">ID MATRÍCULA: ${p.mat}</p>
                <div class="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400">
                    <span class="text-[10px] font-bold uppercase text-zinc-400">${dataFormatada} às ${horaFormatada}</span>
                    <span class="text-[10px] font-black uppercase text-gray-900 italic">Conferir</span>
                </div>`;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  },
};

// Funções Auxiliares Locais
function atualizarStatusRede(online) {
  const badge = document.getElementById("statusLigacao");
  const indicadorRede = document.getElementById("indicadorRede");

  if (badge) {
    badge.innerText = online ? "Conectado" : "Offline (Cache)";
    badge.className = online
      ? "status-badge status-online mb-1"
      : "status-badge status-offline mb-1";
  }
  if (indicadorRede) {
    if (online) {
      indicadorRede.classList.remove("bg-red-500", "animate-pulse");
      indicadorRede.classList.add("bg-emerald-500");
    } else {
      indicadorRede.classList.remove("bg-emerald-500");
      indicadorRede.classList.add("bg-red-500", "animate-pulse");
    }
  }
}

// Inicializa quando a página carregar
window.onload = () => {
  window.Sistema.init();
};
