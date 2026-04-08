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
  renderizarPedidos(tudo = false, termoBusca = "") {
    const container = document.getElementById("gradeAtivos");
    const contador = document.getElementById("totalPedidosMonitor");

    if (!container) return;
    container.innerHTML = "";

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

    dados.forEach((p) => {
      const card = document.createElement("div");
      // Card mais moderno para mobile
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

      card.className =
        "order-card relative rounded-[2.5rem] p-6 flex flex-col animate-entrada-suave cursor-pointer shadow-xl text-left text-zinc-900 hover:scale-[1.02] transition-transform border " +
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

      card.innerHTML = `
                <div class="absolute left-2 top-6 bottom-6 w-1.5 rounded-full ${cardBarClass}"></div>
                <div class="flex justify-between items-start mb-6 text-left">
                    <div class="relative">
                        <img src="${urlAvatar}" class="w-14 h-14 rounded-2xl shadow-sm border-2 border-white object-cover" alt="Perfil" onerror="this.src='${fallbackAvatar}';this.onerror=null;">
                        <div class="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                             ${
                               isEPI
                                 ? '<i data-lucide="shield" class="w-3 h-3 text-blue-500"></i>'
                                 : '<i data-lucide="package" class="w-3 h-3 text-emerald-500"></i>'
                             }
                        </div>
                    </div>
                    <span class="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${color}">${
        p.opc
      }</span>
                </div>
                
                <h3 class="text-lg font-black uppercase text-gray-900 mb-1 leading-tight text-left line-clamp-2">${
                  p.nome
                }</h3>
                
                <div class="flex items-center gap-2 mb-6">
                    <span class="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">MAT: ${
                      p.mat
                    }</span>
                    ${
                      p.id
                        ? `<span class="text-[10px] font-mono text-gray-400">#${p.id}</span>`
                        : ""
                    }
                </div>

                <div class="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div class="flex items-center gap-1.5 text-gray-400">
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        <span class="text-[10px] font-bold uppercase">${dataFormatada} às ${horaFormatada}</span>
                    </div>
                    <div class="bg-zinc-900 rounded-full p-1.5">
                        <i data-lucide="arrow-right" class="w-3 h-3 text-white"></i>
                    </div>
                </div>`;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
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
    // Armazena estado de aprovação por item
    if (!this._itensAprovacao) this._itensAprovacao = {};
    this._itensAprovacao[p.id] = {};

    const itensHtml = p.its
      .split("|")
      .map((i, idx) => {
        const raw = i.trim();
        if (!raw) return "";
        // Detectar marcadores existentes {OK} ou {NAO}
        const temOK = raw.includes("{OK}");
        const temNAO = raw.includes("{NAO}");
        const temFalta = raw.includes("{FALTA}");
        const limpo = raw.replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").trim();
        const match = limpo.match(/^(.*)\[(.+)\]\s*$/);
        const nomeItem = match ? match[1].trim() : limpo;
        const codigoItem = match ? match[2].trim() : "";
        // Só mostrar código se for real (numérico), não gerado automaticamente (NOME-TAMANHO)
        const codigoFinal = (codigoItem && /^\d+$/.test(codigoItem)) ? codigoItem : "";
        const codigoSafe = codigoFinal.replace(/'/g, "\\'");

        // Definir estado inicial
        if (temOK) this._itensAprovacao[p.id][idx] = true;
        else if (temNAO) this._itensAprovacao[p.id][idx] = false;
        else if (temFalta) this._itensAprovacao[p.id][idx] = "falta";

        const estadoClass = temOK ? "border-emerald-200 bg-emerald-50" : temNAO ? "border-red-200 bg-red-50" : temFalta ? "border-amber-200 bg-amber-50" : "border-gray-100";
        const barClass = temOK ? "bg-emerald-500" : temNAO ? "bg-red-400" : temFalta ? "bg-amber-400" : "bg-red-500";

        return `<div id="item-aprov-${p.id}-${idx}" class="flex items-center gap-3 p-3 rounded-xl border shadow-sm mb-2 ${estadoClass} transition-all">
                <div class="w-2 h-full ${barClass} rounded-full flex-shrink-0 self-stretch"></div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-bold uppercase text-zinc-800 break-words leading-snug">${nomeItem}</span>
                  ${
                    codigoFinal
                      ? `<button onclick="UI.copiarCodigo('${codigoSafe}')" class="mt-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg inline-flex items-center gap-1 hover:bg-red-100 transition-colors">COD: ${codigoFinal}<i data-lucide="copy" class="w-3 h-3"></i></button>`
                      : ""
                  }
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, true)" id="btn-ok-${p.id}-${idx}" class="w-9 h-9 rounded-full flex items-center justify-center transition-all ${temOK ? 'bg-emerald-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'}">
                    <i data-lucide="check" class="w-4 h-4"></i>
                  </button>
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, 'falta')" id="btn-falta-${p.id}-${idx}" class="w-9 h-9 rounded-full flex items-center justify-center transition-all ${temFalta ? 'bg-amber-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'}">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                  </button>
                  <button onclick="UI.toggleItemAprovacao('${p.id}', ${idx}, false)" id="btn-nao-${p.id}-${idx}" class="w-9 h-9 rounded-full flex items-center justify-center transition-all ${temNAO ? 'bg-red-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}">
                    <i data-lucide="x" class="w-4 h-4"></i>
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
    
    const statusLower = statusAtual.toUpperCase();
    const statusKey = statusLower
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const isReprovada =
      statusKey.includes("NAO APROV") ||
      statusKey.includes("ERRO") ||
      statusKey.includes("FALTA");
    const isAprovada =
      (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) &&
      !isReprovada;
    const isAmarelo =
      statusKey.includes("ANALISE") || statusKey.includes("AGUARDANDO");
    const sapValue =
      (statusKey.includes("APROVADA") || statusKey.includes("BAIXADA")) &&
      p.sap &&
      p.sap !== "NÃO APROVADA"
        ? p.sap
        : "";
    const statusPainelClass = isAprovada
      ? "bg-emerald-50 border-emerald-200"
      : isReprovada
      ? "bg-red-50 border-red-200"
      : isAmarelo
      ? "bg-amber-50 border-amber-200"
      : "bg-gray-50 border-gray-200";
    const statusBarClass = isAprovada
      ? "bg-emerald-400"
      : isReprovada
      ? "bg-red-400"
      : isAmarelo
      ? "bg-amber-300"
      : "bg-blue-500";
    const statusTextClass = isAprovada
      ? "text-emerald-600"
      : isReprovada
      ? "text-red-600"
      : isAmarelo
      ? "text-amber-600"
      : "text-blue-500";
    const popupBgClass = isAprovada
      ? "bg-emerald-50"
      : isReprovada
      ? "bg-red-50"
      : isAmarelo
      ? "bg-amber-50"
      : "bg-gray-50";
    const popupHeaderClass = isAprovada
      ? "bg-emerald-50"
      : isReprovada
      ? "bg-red-50"
      : isAmarelo
      ? "bg-amber-50"
      : "bg-white";
    const swalBgColor = isAprovada
      ? "#ecfdf5"
      : isReprovada
      ? "#fef2f2"
      : isAmarelo
      ? "#fffbeb"
      : "#ffffff";
    // Popup responsivo que ocupa quase toda a tela no celular
    const larguraPopup = window.innerWidth < 768 ? "95%" : "600px";

    Swal.fire({
      background: swalBgColor,
      color: "#000",
      padding: "0",
      showConfirmButton: false,
      showCloseButton: true,
      width: larguraPopup,
      html: `
                <div id="popupPedidoContainer" class="text-left overflow-hidden ${popupBgClass} text-zinc-900 rounded-[2rem]">
                    <!-- Cabeçalho Imersivo -->
                    <div id="popupPedidoHeader" class="p-6 ${popupHeaderClass} rounded-b-[2.5rem] shadow-sm z-10 relative">
                        <div class="flex items-center gap-4 mb-4">
                            <img src="${urlAvatar}" class="w-16 h-16 rounded-2xl border-4 border-gray-50 shadow-lg object-cover" alt="Foto" onerror="this.src='${fallbackAvatar}';this.onerror=null;">
                            <div class="flex-1 min-w-0">
                                <h2 class="text-xl font-black uppercase italic leading-none mb-1 text-zinc-900 truncate">${
                                  p.nome
                                }</h2>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg border border-gray-200">#${
                                      p.id || "N/A"
                                    }</span>
                                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">${
                                      p.opc
                                    }</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-${p.local ? '3' : '2'} gap-3 mt-2">
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Matrícula</p>
                                <p class="text-base font-black text-zinc-900">${
                                  p.mat
                                }</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Equipe</p>
                                <p class="text-base font-black text-zinc-900 truncate">${
                                  p.equ
                                }</p>
                            </div>
                            ${p.local ? `<div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Local</p>
                                <p class="text-sm font-black text-zinc-900 truncate">${
                                  p.local.replace('DML_', '').replace('_', ' ')
                                }</p>
                            </div>` : ''}
                        </div>
                    </div>

                    <div class="p-6 space-y-6">
                        <!-- Seletor de Status (Estilo Cartão) -->
                        <div id="popupStatusCard" class="p-4 rounded-2xl border shadow-sm relative overflow-hidden ${statusPainelClass}">
                            <div id="popupStatusBar" class="absolute top-0 left-0 w-1.5 h-full ${statusBarClass}"></div>
                            <p id="popupStatusTitle" class="text-[10px] font-black uppercase tracking-widest mb-2 pl-2 ${statusTextClass}">Status do Pedido</p>
                            <div class="relative">
                                <select id="selectStatusAdmin" onchange="UI.handleStatusChange('${p.id}')" class="w-full bg-white/70 border border-zinc-200 text-zinc-900 text-sm font-bold rounded-xl p-3 pl-4 outline-none focus:ring-2 focus:ring-red-200 transition-all appearance-none cursor-pointer uppercase" ${statusAtual === "APROVADA" || statusAtual === "NÃO APROVADA" ? "disabled" : ""}>
                                    <option value="EM ANÁLISE" ${
                                      statusAtual === "EM ANÁLISE" || statusAtual === "AGUARDANDO LIDERANÇA"
                                        ? "selected"
                                        : ""
                                    }>⏳ Em Análise</option>
                                    <option value="APROVADA" ${
                                      statusAtual === "APROVADA" || statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA"
                                        ? "selected"
                                        : ""
                                    }>✅ Aprovada</option>
                                    <option value="NÃO APROVADA" ${
                                      statusAtual === "NÃO APROVADA"
                                        ? "selected"
                                        : ""
                                    }>🚫 Não Aprovada</option>
                                </select>
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                                </div>
                            </div>
                            <p id="msgStatus" class="text-[9px] text-zinc-400 mt-1 pl-2 h-3 transition-all font-bold"></p>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Código SAP (Retirada)</p>
                            <input id="inputSapCodigo" type="text" value="${sapValue}" placeholder="Informe o código do SAP" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-200 transition-all uppercase" oninput="UI.atualizarBotaoAprovacao()">
                            <p class="text-[9px] text-gray-400 mt-2">Para aprovar, informe o código SAP e clique em concluir.</p>
                            <button id="btnConcluirAprovacao" onclick="UI.concluirAprovacao('${p.id}')" class="mt-3 w-full bg-[#F40009] text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-[#d10008] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>Concluir Aprovação</button>
                        </div>

                        <!-- Lista de Itens -->
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Itens Solicitados</p>
                            <div class="space-y-2">${itensHtml}</div>
                        </div>

                        <button onclick="Sistema.notificarWhatsApp('${p.nome}', '${
        p.mat
      }')" class="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-200 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-2">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            Avisar no WhatsApp
                        </button>
                    </div>
                </div>`,
      didOpen: () => {
        window.lucide.createIcons();
        const inputSap = document.getElementById("inputSapCodigo");
        if (
          inputSap &&
          (statusAtual === "APROVADA" || statusAtual === "NÃO APROVADA" ||
           statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA")
        ) {
          inputSap.dataset.locked = "true";
        }
        this.atualizarBotaoAprovacao();
        this.atualizarSapLock();
        this.atualizarCoresPopupStatus(statusAtual);
        // Bloquear botões de itens se já está aprovado/não aprovado
        if (statusAtual === "APROVADA" || statusAtual === "NÃO APROVADA" ||
            statusAtual === "RESERVA APROVADA" || statusAtual === "RESERVA BAIXADA") {
          document.querySelectorAll('[id^="btn-ok-"], [id^="btn-nao-"], [id^="btn-falta-"]').forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.5";
          });
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
      title: "RASTREAMENTO",
      html: `
                <div class="text-left mt-2">
                    <p class="text-xs font-medium text-gray-500 mb-6 text-center">Digite o <b>ID do Pedido</b> ou sua <b>Matrícula</b>.</p>
                    <div class="relative group">
                        <input id="inputRastreio" type="text" placeholder="DIGITE AQUI..." class="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 pl-12 text-lg font-black text-gray-900 outline-none focus:border-red-500 focus:bg-white transition-all uppercase text-center placeholder-gray-300">
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                            <i data-lucide="search" class="w-6 h-6"></i>
                        </div>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "BUSCAR AGORA",
      cancelButtonText: "CANCELAR",
      confirmButtonColor: "#F40009",
      background: "#fff",
      color: "#000",
      customClass: { popup: "swal2-popup-custom" },
      width: window.innerWidth < 640 ? "90%" : "32em",
      didOpen: () => {
        window.lucide.createIcons();
        document.getElementById("inputRastreio").focus();
      },
      preConfirm: () => {
        const val = document.getElementById("inputRastreio").value;
        if (!val) {
          Swal.showValidationMessage("Digite algo para buscar!");
          return false;
        }
        return val;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.Sistema.processarRastreio(result.value);
      }
    });
  },

  mostrarResultadoUnico(p) {
    this.abrirDetalhesPedido(p);
  },

  mostrarHistoricoUsuario(lista) {
    if (lista.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Nada Encontrado",
        text: "Não encontramos solicitações para esta matrícula.",
        confirmButtonColor: "#F40009",
        customClass: { popup: "swal2-popup-custom" },
      });
      return;
    }

    const htmlLista = lista
      .slice(0, 5)
      .map((p) => {
        const statusMap = {
          "AGUARDANDO LIDERANÇA": "bg-yellow-100 text-yellow-700 border-yellow-200",
          "EM ANÁLISE": "bg-yellow-100 text-yellow-700 border-yellow-200",
          "APROVADA": "bg-green-100 text-green-700 border-green-200",
          "RESERVA APROVADA": "bg-green-100 text-green-700 border-green-200",
          "RESERVA BAIXADA": "bg-green-100 text-green-700 border-green-200",
          "NÃO APROVADA": "bg-red-100 text-red-700 border-red-200",
        };
        const cor = statusMap[p.status] || "bg-gray-100 text-gray-600 border-gray-200";

        return `
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-3 text-left relative overflow-hidden group hover:border-red-200 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-black bg-gray-50 px-2 py-1 rounded-lg text-gray-500 border border-gray-100">#${
                      p.id
                    }</span>
                    <span class="text-[10px] font-bold text-gray-400">${
                      p.dt.split(" ")[0]
                    }</span>
                </div>
                <div class="mb-3">${p.its.split("|").map(item => {
                  const raw = item.trim();
                  const isOK = raw.includes("{OK}");
                  const isNAO = raw.includes("{NAO}");
                  const isFalta = raw.includes("{FALTA}");
                  const clean = raw.replace(/\s*\{(OK|NAO|FALTA)\}\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
                  if (!clean) return "";
                  const icon = isOK
                    ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white mr-1 flex-shrink-0"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>'
                    : isNAO
                    ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white mr-1 flex-shrink-0"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></span>'
                    : isFalta
                    ? '<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white mr-1 flex-shrink-0"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg></span>'
                    : '';
                  const textClass = isNAO ? "text-zinc-400 line-through" : isFalta ? "text-amber-700" : "text-zinc-800";
                  return `<div class="flex items-center py-0.5"><span class="flex-shrink-0">${icon}</span><span class="text-sm font-bold ${textClass}">${clean}</span></div>`;
                }).join("")}</div>
                ${
                  p.sap &&
                  p.sap !== "NÃO APROVADA" &&
                  (p.status === "APROVADA" || p.status === "RESERVA APROVADA" ||
                    p.status === "RESERVA BAIXADA")
                    ? `<span class="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border bg-red-50 text-red-600 border-red-100 inline-block mb-2">SAP: ${p.sap}</span>`
                    : ""
                }
                <span class="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${cor} inline-block">${
          p.status || "EM ANÁLISE"
        }</span>
            </div>`;
      })
      .join("");

    Swal.fire({
      title: "Histórico Recente",
      width: window.innerWidth < 640 ? "90%" : "32em",
      html: `<div class="bg-gray-50 p-2 rounded-3xl mt-4 max-h-[60vh] overflow-y-auto custom-scroll">${htmlLista}</div>`,
      confirmButtonText: "FECHAR",
      confirmButtonColor: "#111827",
      customClass: { popup: "swal2-popup-custom" },
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
    const sap = document.getElementById("inputSapCodigo")?.value || "";

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

    // Status só é salvo ao clicar "Concluir Aprovação"
    this.atualizarBotaoAprovacao();
    this.atualizarSapLock();
    this.atualizarCoresPopupStatus(status);
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
    if (btnOk) btnOk.className = `w-9 h-9 rounded-full flex items-center justify-center transition-all ${estado === true ? 'bg-emerald-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'}`;
    if (btnNao) btnNao.className = `w-9 h-9 rounded-full flex items-center justify-center transition-all ${estado === false ? 'bg-red-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}`;
    if (btnFalta) btnFalta.className = `w-9 h-9 rounded-full flex items-center justify-center transition-all ${estado === "falta" ? 'bg-amber-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'}`;
    if (window.lucide) window.lucide.createIcons();
  },

  atualizarBotaoAprovacao() {
    const btn = document.getElementById("btnConcluirAprovacao");
    if (!btn) return;
    const status = document.getElementById("selectStatusAdmin")?.value || "";
    const sap = document.getElementById("inputSapCodigo")?.value || "";
    const locked = document.getElementById("inputSapCodigo")?.dataset.locked === "true";
    const selectDisabled = document.getElementById("selectStatusAdmin")?.disabled;
    const ok = (status === "APROVADA" && sap.trim().length > 0) || status === "NÃO APROVADA";
    btn.disabled = locked || selectDisabled || !ok;
    btn.innerText = (locked || selectDisabled) ? "Concluído" : "Concluir Aprovação";
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
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "success",
        title: "Copiado!",
      });
    });
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
      title: "Carregando Estoque...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      background: "#fff",
      color: "#000",
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

    Swal.fire({
      title: "Contenção Lateral",
      width: larguraPopup,
      html: `
            <div class="flex items-center justify-between mb-4 gap-2">
                 <div class="relative group flex-1">
                    <input id="inputBuscaContencao" type="text" placeholder="Filtrar item..." class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 pl-10 text-sm font-bold text-gray-900 outline-none focus:border-red-500 transition-all uppercase placeholder-gray-300">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                 </div>
                 <button onclick="UI.abrirCadastroContencao()" class="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center hover:scale-105 transition-all" title="Adicionar Produto">
                    <i data-lucide="plus" class="w-5 h-5"></i>
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
        <div class="grid grid-cols-1 gap-3 mt-4">
          <button id="btnAddExistente" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Somar em existente</button>
          <button id="btnAddNovo" class="w-full bg-white text-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100">Novo produto</button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Voltar",
      showCloseButton: true,
      customClass: { popup: "swal2-popup-custom" },
      didOpen: () => {
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
      },
    });

    if (escolha.isDismissed && escolha.dismiss === Swal.DismissReason.cancel) {
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
      confirmButtonColor: "#16a34a",
      cancelButtonText: "Voltar",
      customClass: { popup: "swal2-popup-custom" },
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
        <div class="space-y-3 text-left">
          <div>
            <label class="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Material*</label>
            <input id="contencao-material" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-red-500 transition-all uppercase" placeholder="Ex: Bota de Seguranca">
          </div>
          <div>
            <label class="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Tamanho (opcional)</label>
            <input id="contencao-tamanho" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-red-500 transition-all uppercase" placeholder="Ex: 38 ou P">
          </div>
          <div>
            <label class="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Quantidade para adicionar*</label>
            <input id="contencao-qtd" type="number" min="1" value="1" class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-red-500 transition-all">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      confirmButtonColor: "#16a34a",
      cancelButtonText: "Voltar",
      customClass: { popup: "swal2-popup-custom" },
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

        return `
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-white border border-gray-100 rounded-3xl shadow-sm mb-3 gap-3 relative overflow-hidden transition-all hover:shadow-md">
                ${
                  !this.modoAbastecimento && isLow && item.qtd > 0
                    ? '<div class="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-xl z-10">CRÍTICO</div>'
                    : ""
                }
                
                <div class="flex items-center gap-3">
                    <button onclick="UI.alternarAlertaContencao('${item.material}', '${item.tamanho || ""}', ${item.alerta ? "true" : "false"})" class="w-8 h-8 rounded-xl flex items-center justify-center border ${
          item.alerta
            ? "bg-red-100 border-red-200 text-red-600"
            : "bg-white border-gray-100 text-gray-300 hover:text-red-400"
        } shadow-sm transition-all" title="Alerta de crÃ­tico">
                        <i data-lucide="bell" class="w-4 h-4"></i>
                    </button>
                    <img src="${fotoUrl}" class="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0">
                    <div class="text-left flex-1 min-w-0">
                        <p class="text-xs font-black uppercase text-zinc-900 leading-tight mb-0.5 line-clamp-2">${
                          item.material
                        }</p>
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 inline-block px-1.5 py-0.5 rounded-md border border-gray-100">${
                          item.tamanho
                        }</p>
                    </div>
                </div>
                
                <div class="flex flex-row items-center justify-between gap-2 border-t sm:border-t-0 border-gray-50 pt-2 sm:pt-0">
                    <div class="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button onclick="UI.ajustarQtd('${idUnico}', -1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-red-500 font-bold disabled:opacity-50" ${
          isDisabled ? "disabled" : ""
        }>-</button>
                        <span id="label-${idUnico}" class="text-xs font-black w-6 text-center text-zinc-900">1</span>
                        <button onclick="UI.ajustarQtd('${idUnico}', 1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-green-500 font-bold" ${
          isDisabled ? "disabled" : ""
        }>+</button>
                    </div>

                    <div class="flex flex-col items-end gap-1">
                        <span class="text-[9px] font-black px-2 py-0.5 rounded-md border ${corQtd}">Estoque: ${
          item.qtd
        }</span>
                        <button 
                            onclick="UI.baixarEstoque('${item.material}', '${
          item.tamanho
        }', parseInt(document.getElementById('label-${idUnico}').innerText))" 
                            class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${btnClass}"
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
