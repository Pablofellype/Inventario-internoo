import { State } from '../core/state.js';
import { Api } from '../services/api.js';
import { Cache } from '../services/cache.js';

export const PublicForm = {
    dadosPedido: {
        colaborador: "",
        matricula: "",
        equipe: "",
        tipo: "",
        setorDML: "",
        itens: [] 
    },
    
    carrinhoTemp: {}, 
    passoAtual: 1,

    abrir() {
        if (!State.colaboradores || State.colaboradores.length === 0) {
            Api.carregarColaboradores();
        }
        document.getElementById("telaLogin").classList.add("hidden");
        document.getElementById("containerFormularioPublico").classList.remove("hidden");
        this.renderizarEtapa1();
    },

    fechar() {
        document.getElementById("containerFormularioPublico").classList.add("hidden");
        document.getElementById("telaLogin").classList.remove("hidden");
        this.resetarFormulario();
    },

    resetarFormulario() {
        this.dadosPedido = { colaborador: "", matricula: "", equipe: "", tipo: "", setorDML: "", itens: [] };
        this.carrinhoTemp = {};
        this.passoAtual = 1;
    },

    // =================================================================
    // ETAPA 1: IDENTIFICAÇÃO
    // =================================================================
    renderizarEtapa1() {
        this.atualizarProgresso(1);
        const area = document.getElementById("areaEtapas");
        area.innerHTML = `
        <div class="animate-entrada-suave">
            <!-- Header visual -->
            <div class="text-center mb-8">
                <div class="relative inline-block">
                    <div id="avatarColaborador" class="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-50 to-red-100 text-[#F40009] rounded-full flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(244,0,9,0.12)] overflow-hidden border-4 border-white transition-all duration-500">
                        <i data-lucide="user" class="w-9 h-9 sm:w-10 sm:h-10"></i>
                    </div>
                    <div id="badgeVerificado" class="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center border-2 border-white transition-all duration-300">
                        <i data-lucide="scan-face" class="w-3.5 h-3.5 text-zinc-400"></i>
                    </div>
                </div>
                <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 mt-5 mb-1 leading-tight">Identifique-se</h3>
                <p class="text-xs sm:text-sm text-zinc-400 max-w-[260px] mx-auto">Comece digitando seu nome para localizar seu cadastro.</p>
            </div>

            <!-- Campo de busca -->
            <div class="relative text-left mb-4">
                <label class="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2 block pl-1">Nome do Colaborador</label>
                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"><i data-lucide="search" class="w-4 h-4"></i></div>
                    <input type="text" id="inputBuscaNome" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" readonly onfocus="this.removeAttribute('readonly')"
                        class="w-full bg-zinc-50 border-2 border-zinc-100 pl-11 pr-4 py-4 rounded-2xl font-bold text-zinc-900 outline-none focus:bg-white focus:border-[#F40009] focus:ring-4 focus:ring-red-50 transition-all uppercase text-sm placeholder:text-zinc-300 placeholder:normal-case"
                        placeholder="Ex: Maria, João...">
                </div>
                <div id="listaSugestoes" class="hidden absolute top-full left-0 right-0 bg-white border border-zinc-100 shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-2xl mt-2 max-h-52 overflow-y-auto z-50 divide-y divide-zinc-50"></div>
            </div>

            <!-- Matrícula (aparece após seleção) -->
            <div class="text-left opacity-40 transition-all duration-500 scale-[0.98]" id="boxMatricula">
                <label class="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2 block pl-1">Matrícula Vinculada</label>
                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"><i data-lucide="hash" class="w-4 h-4"></i></div>
                    <input type="text" id="inputMatriculaAuto" disabled class="w-full bg-zinc-50 border-2 border-transparent pl-11 pr-4 py-4 rounded-2xl font-bold text-zinc-400 text-sm" placeholder="Preenchimento automático">
                </div>
            </div>

            <!-- Botão continuar -->
            <button id="btnAvancar1" disabled onclick="PublicForm.renderizarEtapa2()"
                class="mt-8 w-full bg-zinc-100 text-zinc-300 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-300 cursor-not-allowed flex items-center justify-center gap-2">
                Continuar <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
            <button onclick="PublicForm.fechar()" class="mt-4 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2">Cancelar</button>
        </div>`;
        
        const input = document.getElementById("inputBuscaNome");
        const lista = document.getElementById("listaSugestoes");
        input.addEventListener("input", (e) => {
            const termo = e.target.value.toUpperCase();
            if (termo.length === 0) { lista.classList.add("hidden"); return; }
            const fonteDados = State.colaboradores || [];
            const filtrados = fonteDados.filter(c => c.nome && c.nome.toUpperCase().startsWith(termo));
            if (filtrados.length > 0) {
                lista.innerHTML = filtrados.map(c => {
                    const avatarSrc = c.imagem ? `<img src="${c.imagem}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<i data-lucide=\\'user\\' class=\\'w-4 h-4\\'></i>';if(window.lucide)window.lucide.createIcons();">` : '<i data-lucide="user" class="w-4 h-4"></i>';
                    return `<div class="px-4 py-3 hover:bg-red-50/60 cursor-pointer flex items-center gap-3 group transition-colors active:bg-red-100" onclick="PublicForm.selecionarColaborador('${c.nome}', '${c.matricula}')">
                        <div class="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-red-100 flex items-center justify-center text-zinc-400 group-hover:text-[#F40009] overflow-hidden flex-shrink-0 transition-colors">${avatarSrc}</div>
                        <div class="flex-1 min-w-0"><p class="font-bold text-zinc-700 group-hover:text-[#F40009] text-sm truncate transition-colors">${c.nome}</p></div>
                        <span class="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 group-hover:bg-red-100 group-hover:text-[#F40009] px-2 py-1 rounded-lg flex-shrink-0 transition-colors">${c.matricula}</span>
                    </div>`;
                }).join("");
                lista.classList.remove("hidden");
            } else { lista.classList.add("hidden"); }
        });
        if(window.lucide) window.lucide.createIcons();
    },

    selecionarColaborador(nome, matricula) {
        document.getElementById("inputBuscaNome").value = nome;
        document.getElementById("listaSugestoes").classList.add("hidden");
        const inputMat = document.getElementById("inputMatriculaAuto");
        const btn = document.getElementById("btnAvancar1");
        const boxMat = document.getElementById("boxMatricula");
        const badge = document.getElementById("badgeVerificado");

        inputMat.value = matricula;
        boxMat.classList.remove("opacity-40", "scale-[0.98]");
        boxMat.classList.add("opacity-100", "scale-100");
        inputMat.classList.replace("bg-zinc-50", "bg-white");
        inputMat.classList.replace("text-zinc-400", "text-zinc-900");
        inputMat.classList.add("border-zinc-200");

        this.dadosPedido.colaborador = nome;
        this.dadosPedido.matricula = matricula;

        // Atualizar avatar com foto do colaborador
        const colab = (State.colaboradores || []).find(c => c.matricula === matricula);
        const avatarEl = document.getElementById("avatarColaborador");
        if (colab && colab.imagem && avatarEl) {
            avatarEl.innerHTML = `<img src="${colab.imagem}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<i data-lucide=\\'user\\' class=\\'w-9 h-9 sm:w-10 sm:h-10\\'></i>';if(window.lucide)window.lucide.createIcons();">`;
            avatarEl.classList.add("shadow-[0_8px_30px_rgba(244,0,9,0.2)]");
        }

        // Badge de verificado verde
        if (badge) {
            badge.classList.remove("bg-zinc-200");
            badge.classList.add("bg-emerald-500");
            badge.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>';
        }

        btn.disabled = false;
        btn.className = "mt-8 w-full bg-[#F40009] text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(244,0,9,0.3)] hover:shadow-[0_12px_35px_rgba(244,0,9,0.4)] hover:scale-[1.02] active:scale-[0.98]";
        if(window.lucide) window.lucide.createIcons();
    },

    // =================================================================
    // ETAPA 2: EQUIPE
    // =================================================================
    renderizarEtapa2() {
        this.atualizarProgresso(2);
        document.getElementById("areaEtapas").innerHTML = `
        <div class="animate-entrada-suave">
            <div class="text-center mb-6 sm:mb-8">
                <div class="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F40009] shadow-[0_4px_15px_rgba(244,0,9,0.1)]">
                    <i data-lucide="users" class="w-7 h-7"></i>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-zinc-900 mb-1">Qual sua equipe?</h3>
                <p class="text-xs text-zinc-400">Selecione seu setor de trabalho</p>
            </div>

            <!-- Seção Limpeza -->
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2 pl-1">Limpeza</p>
            <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                <button onclick="PublicForm.selecionarEquipe('DIURNO')" class="group p-4 sm:p-5 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer text-center active:scale-95">
                    <div class="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-3 group-hover:bg-amber-100 transition-colors"><i data-lucide="sun" class="w-5 h-5"></i></div>
                    <p class="font-black text-zinc-700 uppercase text-xs sm:text-sm leading-tight group-hover:text-[#F40009] transition-colors">Diurno</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Manhã / Tarde</p>
                </button>
                <button onclick="PublicForm.selecionarEquipe('NOTURNO')" class="group p-4 sm:p-5 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer text-center active:scale-95">
                    <div class="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400 mx-auto mb-3 group-hover:bg-indigo-100 transition-colors"><i data-lucide="moon" class="w-5 h-5"></i></div>
                    <p class="font-black text-zinc-700 uppercase text-xs sm:text-sm leading-tight group-hover:text-[#F40009] transition-colors">Noturno</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Noite</p>
                </button>
            </div>

            <!-- Seção Segurança -->
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2 pl-1">Segurança Patrimonial</p>
            <div class="grid grid-cols-2 gap-2 sm:gap-3">
                <button onclick="PublicForm.selecionarEquipe('SEGURANCA_DIURNO')" class="group p-4 sm:p-5 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer text-center active:scale-95">
                    <div class="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-3 group-hover:bg-amber-100 transition-colors"><i data-lucide="shield" class="w-5 h-5"></i></div>
                    <p class="font-black text-zinc-700 uppercase text-xs sm:text-sm leading-tight group-hover:text-[#F40009] transition-colors">Diurno</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Manhã / Tarde</p>
                </button>
                <button onclick="PublicForm.selecionarEquipe('SEGURANCA_NOTURNO')" class="group p-4 sm:p-5 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer text-center active:scale-95">
                    <div class="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400 mx-auto mb-3 group-hover:bg-indigo-100 transition-colors"><i data-lucide="shield-check" class="w-5 h-5"></i></div>
                    <p class="font-black text-zinc-700 uppercase text-xs sm:text-sm leading-tight group-hover:text-[#F40009] transition-colors">Noturno</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Noite</p>
                </button>
            </div>

            <button onclick="PublicForm.fechar()" class="mt-6 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2">Cancelar</button>
        </div>`;
        if(window.lucide) window.lucide.createIcons();
    },

    selecionarEquipe(equipe) {
        this.dadosPedido.equipe = equipe;
        this.renderizarEtapa3();
    },

    // =================================================================
    // ETAPA 3: TIPO
    // =================================================================
    renderizarEtapa3() {
        this.atualizarProgresso(3);
        const isSeguranca = this.dadosPedido.equipe.startsWith('SEGURANCA');
        const botaoMaterial = isSeguranca ? '' : `
                <button onclick="PublicForm.selecionarTipo('MATERIAL')" class="group p-5 sm:p-6 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 active:scale-95">
                    <div class="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                        <svg viewBox="0 0 24 24" class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M3 10a4 4 0 0 0 0 8h9a4 4 0 0 0 0-8H3z"></path>
                            <path d="M12 10V6a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0"></path>
                            <circle cx="6" cy="14" r="1.5"></circle>
                        </svg>
                    </div>
                    <p class="font-black text-zinc-700 group-hover:text-[#F40009] uppercase text-xs sm:text-sm leading-tight transition-colors">Material de<br>Limpeza</p>
                    <p class="text-[10px] text-zinc-400">Produtos e insumos</p>
                </button>`;
        document.getElementById("areaEtapas").innerHTML = `
        <div class="animate-entrada-suave">
            <div class="text-center mb-6 sm:mb-8">
                <div class="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F40009] shadow-[0_4px_15px_rgba(244,0,9,0.1)]">
                    <i data-lucide="package" class="w-7 h-7"></i>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-zinc-900 mb-1">O que deseja solicitar?</h3>
                <p class="text-xs text-zinc-400">Escolha a categoria do pedido</p>
            </div>
            <div class="${isSeguranca ? 'flex justify-center' : 'grid grid-cols-2'} gap-3">
                <button onclick="PublicForm.selecionarTipo('SOLICITACAO_EPI_UNIFORME')" class="group p-5 sm:p-6 bg-zinc-50 border-2 border-transparent rounded-2xl hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 active:scale-95 ${isSeguranca ? 'w-full max-w-[200px]' : ''}">
                    <div class="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors"><i data-lucide="shirt" class="w-7 h-7"></i></div>
                    <p class="font-black text-zinc-700 group-hover:text-[#F40009] uppercase text-xs sm:text-sm leading-tight transition-colors">EPI &<br>Uniforme</p>
                    <p class="text-[10px] text-zinc-400">Equipamentos e roupas</p>
                </button>
                ${botaoMaterial}
            </div>
            <button onclick="PublicForm.fechar()" class="mt-6 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2">Cancelar</button>
        </div>`;
        if(window.lucide) window.lucide.createIcons();
    },

    selecionarTipo(tipo) {
        this.dadosPedido.tipo = tipo;
        this.carrinhoTemp = {}; 
        if (tipo === 'MATERIAL') {
            this.renderizarEtapa4();
        } else {
            this.renderizarSelecaoProdutos('SOLICITACAO_EPI_UNIFORME');
        }
    },

    // =================================================================
    // ETAPA 4: LOCAL
    // =================================================================
    renderizarEtapa4() {
        this.atualizarProgresso(4);
        const locais = [
            { id: "DML_COMERCIAL", nome: "DML Comercial", icon: "briefcase", cor: "bg-blue-50 text-blue-500" },
            { id: "DML_ESTOQUE", nome: "DML Estoque", icon: "package", cor: "bg-amber-50 text-amber-500" },
            { id: "DML_CCB", nome: "DML CCB", icon: "building-2", cor: "bg-purple-50 text-purple-500" },
            { id: "DML_INDUSTRIA", nome: "DML Indústria", icon: "factory", cor: "bg-emerald-50 text-emerald-500" },
            { id: "DML_OFICINA", nome: "DML Oficina", icon: "wrench", cor: "bg-orange-50 text-orange-500" }
        ];
        const botoes = locais.map(l => `
            <button onclick="PublicForm.finalizarDML('${l.id}')" class="group w-full p-3.5 sm:p-4 bg-zinc-50 border-2 border-transparent rounded-2xl flex items-center gap-3 sm:gap-4 hover:border-[#F40009] hover:bg-red-50 transition-all cursor-pointer active:scale-[0.98]">
                <div class="w-10 h-10 sm:w-11 sm:h-11 ${l.cor} rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"><i data-lucide="${l.icon}" class="w-5 h-5"></i></div>
                <span class="font-black text-zinc-700 group-hover:text-[#F40009] uppercase text-xs sm:text-sm transition-colors">${l.nome}</span>
                <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-[#F40009] ml-auto transition-colors"></i>
            </button>`).join("");

        document.getElementById("areaEtapas").innerHTML = `
        <div class="animate-entrada-suave">
            <div class="text-center mb-6 sm:mb-8">
                <div class="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F40009] shadow-[0_4px_15px_rgba(244,0,9,0.1)]">
                    <i data-lucide="map-pin" class="w-7 h-7"></i>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-zinc-900 mb-1">Qual Local?</h3>
                <p class="text-xs text-zinc-400">Selecione para onde é o material</p>
            </div>
            <div class="space-y-2 sm:space-y-3">${botoes}</div>
            <button onclick="PublicForm.fechar()" class="mt-6 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2">Cancelar</button>
        </div>`;
        if(window.lucide) window.lucide.createIcons();
    },

    finalizarDML(dml) {
        this.dadosPedido.setorDML = dml;
        this.renderizarSelecaoProdutos(dml);
    },

    // =================================================================
    // ETAPA 5: SELEÇÃO (COM TRAVA DE TAMANHO)
    // =================================================================
    async renderizarSelecaoProdutos(categoriaID) {
        const area = document.getElementById("areaEtapas");
        area.innerHTML = `<div class="text-center py-16 sm:py-20"><div class="w-12 h-12 border-[3px] border-zinc-100 border-t-[#F40009] rounded-full animate-spin mx-auto"></div><p class="mt-5 text-[11px] font-black uppercase text-zinc-400 tracking-widest">Carregando Itens...</p></div>`;

        let produtos = await Cache.carregar(categoriaID);
        if (!produtos || produtos.length === 0) {
            await Api.preCarregarTudo(); 
            produtos = await Cache.carregar(categoriaID);
        }

        const acaoVoltar = this.dadosPedido.tipo === 'MATERIAL' ? 'PublicForm.renderizarEtapa4()' : 'PublicForm.renderizarEtapa3()';

        if (!produtos || produtos.length === 0) {
            area.innerHTML = `<div class="text-center py-20"><p class="text-gray-400">Nenhum item encontrado.</p><button onclick="${acaoVoltar}" class="mt-4 text-[#F40009] font-bold underline">Voltar</button></div>`;
            return;
        }

        let htmlLista = `
        <div class="animate-entrada-suave pb-24">
            <div class="flex items-center gap-3 mb-5 sm:mb-6">
                <button onclick="${acaoVoltar}" class="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-[#F40009] transition-all flex-shrink-0 active:scale-90">
                    <i data-lucide="arrow-left" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                </button>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base sm:text-lg font-black text-zinc-900 uppercase leading-none truncate">${categoriaID.replace('_', ' ').replace('SOLICITACAO', '')}</h3>
                    <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Selecione os itens e quantidades</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:gap-3">`;

        produtos.forEach((prod, index) => {
            const safeRoot = `prod-${index}`;
            const labelUpper = prod.vars[0].label.toUpperCase();
            const eUnico = prod.vars.length === 1 && (labelUpper === 'UNICO' || labelUpper === 'ÚNICO' || labelUpper === 'UNIDADE' || labelUpper === 'U');
            const temVariacao = prod.vars.length > 1;

            let seletorHTML = "";
            let codigoInicial = ""; 
            let labelInicial = "";
            let quantidadeInicial = 0;
            const varComQtd = prod.vars.find(v => (this.carrinhoTemp[v.code]?.qtd || 0) > 0);

            if (temVariacao) {
                if (varComQtd) {
                    codigoInicial = varComQtd.code;
                    labelInicial = varComQtd.label;
                    quantidadeInicial = this.carrinhoTemp[varComQtd.code]?.qtd || 0;
                }
                // --- DROPDOWN (Começa Neutro) ---
                seletorHTML = `
                <div class="relative w-full mb-3 px-1 z-10">
                    <button id="btn-dd-${safeRoot}" onclick="PublicForm.toggleDropdown('${safeRoot}')" class="w-full bg-gray-50 border border-gray-200 ${varComQtd ? 'text-[#F40009]' : 'text-gray-400'} text-xs font-bold rounded-xl p-3 flex justify-between items-center outline-none focus:border-[#F40009] transition-all uppercase shadow-sm active:scale-95">
                        <span id="txt-dd-${safeRoot}">${varComQtd ? `TAM: ${labelInicial}` : 'ESCOLHER OPÇÃO'}</span>
                        <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400"></i>
                    </button>
                    
                    <div id="list-dd-${safeRoot}" class="hidden absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto animate-entrada-suave">
                        ${prod.vars.map(v => `
                            <div onclick="PublicForm.selecionarTamanho('${safeRoot}', '${v.code}', '${v.label}', '${prod.root}')" class="p-3 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-[#F40009] cursor-pointer border-b border-gray-50 last:border-0 uppercase transition-colors">
                                TAM: ${v.label}
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="sel-${safeRoot}" value="${codigoInicial}" data-label="${labelInicial}" data-has-vars="true">
                </div>`;
            } else if (eUnico) {
                codigoInicial = prod.vars[0].code;
                labelInicial = prod.vars[0].label;
                quantidadeInicial = this.carrinhoTemp[codigoInicial]?.qtd || 0;
                seletorHTML = `<input type="hidden" id="sel-${safeRoot}" value="${codigoInicial}" data-label="${labelInicial}" data-has-vars="false"><div class="h-2"></div>`; 
            } else {
                codigoInicial = prod.vars[0].code;
                labelInicial = prod.vars[0].label;
                quantidadeInicial = this.carrinhoTemp[codigoInicial]?.qtd || 0;
                seletorHTML = `<input type="hidden" id="sel-${safeRoot}" value="${codigoInicial}" data-label="${labelInicial}" data-has-vars="false"><div class="w-full mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 py-1 rounded-lg">TAM: ${labelInicial}</div>`;
            }

            htmlLista += `
            <div class="bg-white p-2.5 sm:p-3 rounded-2xl border border-zinc-100 flex flex-col items-center text-center relative group hover:shadow-lg hover:border-zinc-200 transition-all duration-200">
                <div class="relative w-full aspect-square mb-2 cursor-zoom-in overflow-hidden rounded-xl bg-zinc-50" onclick="PublicForm.verFotoGrande('${prod.f}', '${prod.root}')">
                    <img src="${prod.f}" onerror="this.src='assets/img/placeholder.png'" class="w-full h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-500">
                    <div class="absolute bottom-1 right-1 bg-black/40 text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="maximize-2" class="w-3 h-3"></i></div>
                </div>

                <p class="text-[9px] sm:text-[10px] font-bold text-zinc-700 leading-tight h-7 sm:h-8 overflow-hidden line-clamp-2 uppercase mb-2 w-full px-0.5">${prod.root}</p>
                ${seletorHTML}

                <div class="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 rounded-xl p-1 w-full justify-between mt-auto">
                    <button onclick="PublicForm.clickCounter('${safeRoot}', '${prod.root}', -1)" class="w-7 h-7 sm:w-8 sm:h-8 bg-white shadow-sm rounded-lg text-zinc-400 font-bold hover:text-[#F40009] active:scale-90 transition-all text-base sm:text-lg border border-zinc-100">-</button>
                    <span id="display-${safeRoot}" class="font-black text-sm text-zinc-900 min-w-[20px]">${quantidadeInicial}</span>
                    <button onclick="PublicForm.clickCounter('${safeRoot}', '${prod.root}', 1)" class="w-7 h-7 sm:w-8 sm:h-8 bg-zinc-900 shadow-sm rounded-lg text-white font-bold hover:bg-[#F40009] active:scale-90 transition-all text-base sm:text-lg">+</button>
                </div>
            </div>`;
        });

        htmlLista += `</div>
        <div id="barradeConclusao" class="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-3 sm:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] hidden animate-emergir z-40 mt-4 rounded-2xl border border-zinc-100">
            <div class="w-full flex justify-between items-center gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-[#F40009]/10 rounded-xl flex items-center justify-center flex-shrink-0"><i data-lucide="shopping-bag" class="w-5 h-5 text-[#F40009]"></i></div>
                    <div><p class="text-[10px] text-zinc-400 uppercase font-bold leading-none">Itens</p><p id="totalItensResumo" class="text-lg font-black text-zinc-900 leading-tight">0</p></div>
                </div>
                <button onclick="PublicForm.revisarPedido()" class="bg-[#F40009] text-white px-5 sm:px-8 py-3 rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-[0_6px_20px_rgba(244,0,9,0.3)] hover:shadow-[0_8px_30px_rgba(244,0,9,0.4)] active:scale-95 transition-all flex items-center gap-2">
                    Revisar <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
        
        area.innerHTML = htmlLista;
        this.atualizarBotaoConcluir();
        if(window.lucide) window.lucide.createIcons();
    },

    toggleDropdown(safeRoot) {
        document.querySelectorAll('[id^="list-dd-"]').forEach(el => {
            if (el.id !== `list-dd-${safeRoot}`) el.classList.add('hidden');
        });
        const lista = document.getElementById(`list-dd-${safeRoot}`);
        lista.classList.toggle('hidden');
    },

    selecionarTamanho(safeRoot, codigo, label, rootName) {
        const input = document.getElementById(`sel-${safeRoot}`);
        input.value = codigo;
        input.setAttribute('data-label', label);
        
        const btnTxt = document.getElementById(`txt-dd-${safeRoot}`);
        btnTxt.innerText = `TAM: ${label}`;
        btnTxt.classList.remove("text-gray-400");
        btnTxt.classList.add("text-[#F40009]");

        document.getElementById(`list-dd-${safeRoot}`).classList.add('hidden');
        this.atualizarDisplayCounter(safeRoot);
    },

    clickCounter(safeRoot, rootName, delta) {
        const input = document.getElementById(`sel-${safeRoot}`);
        const codigo = input.value;
        const hasVars = input.getAttribute("data-has-vars") === "true";
        
        if (hasVars && (!codigo || codigo === "")) {
            if (delta > 0) {
                this.toggleDropdown(safeRoot);
                const btn = document.getElementById(`btn-dd-${safeRoot}`);
                btn.classList.add("ring-2", "ring-red-300");
                setTimeout(() => btn.classList.remove("ring-2", "ring-red-300"), 500);
            }
            return;
        }

        const labelTamanho = input.getAttribute("data-label");
        let nomeFinal = rootName;
        const labelUpper = labelTamanho.toUpperCase();
        if (labelUpper !== "UNICO" && labelUpper !== "ÚNICO" && labelUpper !== "UNIDADE") {
            nomeFinal = `${rootName} [${labelTamanho}]`;
        }

        this.alterarQtd(codigo, nomeFinal, delta);
        this.atualizarDisplayCounter(safeRoot);
    },

    atualizarDisplayCounter(safeRoot) {
        const input = document.getElementById(`sel-${safeRoot}`);
        const codigo = input.value;
        const display = document.getElementById(`display-${safeRoot}`);
        
        if (!codigo) { display.innerText = "0"; return; }

        const qtdAtual = this.carrinhoTemp[codigo] ? this.carrinhoTemp[codigo].qtd : 0;
        
        display.innerText = qtdAtual;
        display.classList.remove("text-gray-900");
        display.classList.add("text-[#F40009]", "scale-125");
        setTimeout(() => display.classList.remove("text-[#F40009]", "scale-125", "text-gray-900"), 200);
    },

    alterarQtd(codigo, nome, delta) {
        if (!this.carrinhoTemp[codigo]) { this.carrinhoTemp[codigo] = { nome: nome, qtd: 0 }; }
        this.carrinhoTemp[codigo].qtd += delta;
        if (this.carrinhoTemp[codigo].qtd < 0) this.carrinhoTemp[codigo].qtd = 0;
        if (this.carrinhoTemp[codigo].qtd === 0) delete this.carrinhoTemp[codigo];
        this.atualizarBotaoConcluir();
    },

    atualizarBotaoConcluir() {
        const barra = document.getElementById("barradeConclusao");
        const totalSpan = document.getElementById("totalItensResumo");
        const totalItens = Object.values(this.carrinhoTemp).reduce((acc, item) => acc + item.qtd, 0);
        if (totalSpan) totalSpan.innerText = totalItens;
        if (totalItens > 0) barra.classList.remove("hidden");
        else barra.classList.add("hidden");
    },

    verFotoGrande(url, nome) {
        const modal = document.createElement("div");
        modal.className = "fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-entrada-suave cursor-zoom-out";
        modal.onclick = () => modal.remove();
        modal.innerHTML = `<div class="relative max-w-full max-h-full" onclick="event.stopPropagation()">
            <img src="${url}" class="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain">
            <p class="text-white/80 text-center mt-3 font-bold uppercase text-xs tracking-widest">${nome}</p>
            <button onclick="this.closest('.fixed').remove()" class="absolute -top-3 -right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>`;
        document.body.appendChild(modal);
        if(window.lucide) window.lucide.createIcons();
    },

    revisarPedido() {
        this.atualizarProgresso(6);
        const area = document.getElementById("areaEtapas");
        const itensArr = Object.entries(this.carrinhoTemp);
        const totalItens = itensArr.reduce((acc, [, d]) => acc + d.qtd, 0);
        const itensHtml = itensArr.map(([code, dados], idx) => {
            return `<div class="flex justify-between items-center py-3 ${idx < itensArr.length - 1 ? 'border-b border-zinc-50' : ''}">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <div class="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0"><i data-lucide="check" class="w-3 h-3 text-emerald-500"></i></div>
                    <span class="font-bold text-zinc-700 uppercase text-[11px] sm:text-xs truncate">${dados.nome}</span>
                </div>
                <span class="font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg text-xs sm:text-sm flex-shrink-0 ml-2">${dados.qtd}x</span>
            </div>`;
        }).join("");

        const colab = (State.colaboradores || []).find(c => c.matricula === this.dadosPedido.matricula);
        const avatarHtml = (colab && colab.imagem)
            ? `<img src="${colab.imagem}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<i data-lucide=\\'clipboard-check\\' class=\\'w-8 h-8\\'></i>';if(window.lucide)window.lucide.createIcons();">`
            : '<i data-lucide="clipboard-check" class="w-8 h-8"></i>';

        area.innerHTML = `
            <div class="animate-entrada-suave">
                <div class="text-center mb-6 sm:mb-8">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-50 to-red-100 text-[#F40009] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-[0_8px_25px_rgba(244,0,9,0.12)] border-4 border-white">${avatarHtml}</div>
                    <h3 class="text-xl sm:text-2xl font-black text-zinc-900 mb-1">Confirme seu Pedido</h3>
                    <p class="text-xs text-zinc-400">Verifique se tudo está correto antes de enviar</p>
                </div>

                <!-- Card do colaborador -->
                <div class="bg-zinc-50 rounded-2xl p-4 sm:p-5 mb-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Colaborador</p>
                            <p class="font-black text-base sm:text-lg text-zinc-900 leading-tight mt-0.5">${this.dadosPedido.colaborador}</p>
                        </div>
                        <span class="text-[10px] font-mono font-bold text-zinc-400 bg-white px-3 py-1.5 rounded-lg border border-zinc-100">MAT: ${this.dadosPedido.matricula}</span>
                    </div>
                </div>

                <!-- Card dos itens -->
                <div class="bg-zinc-50 rounded-2xl p-4 sm:p-5 mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Itens Solicitados</p>
                        <span class="text-[10px] font-black text-[#F40009] bg-red-50 px-2 py-0.5 rounded-full">${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>
                    </div>
                    ${itensHtml}
                </div>

                <button id="btnEnviarFinal" onclick="PublicForm.concluirSolicitacao()"
                    class="w-full bg-[#F40009] text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm shadow-[0_8px_25px_rgba(244,0,9,0.3)] hover:shadow-[0_12px_35px_rgba(244,0,9,0.4)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Confirmar Pedido <i data-lucide="send" class="w-4 h-4"></i>
                </button>
                <button onclick="PublicForm.renderizarSelecaoProdutos('${this.dadosPedido.tipo === 'MATERIAL' ? this.dadosPedido.setorDML : 'SOLICITACAO_EPI_UNIFORME'}')"
                    class="mt-3 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2 flex items-center justify-center gap-1">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Voltar e Alterar
                </button>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();
    },

    // =================================================================
    // GERAÇÃO DE ID ÚNICO NA FINALIZAÇÃO 🆔
    // =================================================================
    async concluirSolicitacao() {
        const btn = document.getElementById("btnEnviarFinal");
        btn.innerHTML = `<div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> <span class="ml-1">Enviando...</span>`;
        btn.disabled = true;

        const itensTexto = Object.entries(this.carrinhoTemp).map(([code, i]) => `(${i.qtd}x) ${i.nome} [${code}]`).join(" | ");
        
        // GERA UM ID ÚNICO (Hora + Random)
        const idUnico = "#" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 9);

        const payload = {
            id: idUnico, // <--- ID NOVO SENDO ENVIADO
            matricula: this.dadosPedido.matricula,
            nome: this.dadosPedido.colaborador,
            equipe: this.dadosPedido.equipe,
            tipo: this.dadosPedido.tipo === 'SOLICITACAO_EPI_UNIFORME' ? 'EPI_UNIFORME' : 'MATERIAL',
            local: this.dadosPedido.setorDML || "",
            itens: itensTexto
        };

        Api.enviarPedidoPlanilha(payload);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const containerForm = document.getElementById("containerFormularioPublico");
        const modalHtml = `
        <div id="modalSolicitacao" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-entrada-suave">
            <div class="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_30px_80px_rgba(0,0,0,0.2)] relative">
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div class="w-16 h-16 bg-emerald-500 border-4 border-white text-white rounded-full flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.4)]">
                        <i data-lucide="check" class="w-8 h-8"></i>
                    </div>
                </div>
                <div class="mt-6">
                    <h3 class="text-xl sm:text-2xl font-black text-zinc-900 mb-1">Pedido Enviado!</h3>
                    <p class="text-zinc-500 text-xs sm:text-sm mb-4">Sua solicitação foi registrada com sucesso.</p>
                    <div class="bg-zinc-50 rounded-xl p-3 mb-6 border border-zinc-100">
                        <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Protocolo</p>
                        <p class="text-base font-mono font-black text-zinc-900">${idUnico}</p>
                    </div>
                    <button onclick="PublicForm.novoPedido()" class="w-full bg-[#F40009] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-[#d10008] transition-all shadow-[0_6px_20px_rgba(244,0,9,0.3)] active:scale-[0.98]">
                        Novo Pedido
                    </button>
                    <button onclick="PublicForm.finalizarModal()" class="mt-2 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-zinc-600 transition-colors py-2.5">
                        Fechar
                    </button>
                </div>
            </div>
        </div>`;
        containerForm.insertAdjacentHTML('beforeend', modalHtml);
        if(window.lucide) window.lucide.createIcons();
    },

    atualizarProgresso(passo) {
        const titulos = { 1: "Identificação", 2: "Equipe", 3: "Tipo", 4: "Local", 5: "Seleção", 6: "Revisão" };
        const total = this.dadosPedido.tipo === 'SOLICITACAO_EPI_UNIFORME' ? '5' : '6';
        document.getElementById("contadorEtapa").innerText = `${titulos[passo] || 'Etapa'} (${passo}/${total})`;
        this.passoAtual = passo;
    },

    novoPedido() {
        const modal = document.getElementById("modalSolicitacao");
        if (modal) modal.remove();
        this.resetarFormulario();
        this.renderizarEtapa1();
    },

    finalizarModal() {
        const modal = document.getElementById("modalSolicitacao");
        if (modal) modal.remove();
        this.fechar();
    },

    voltarEtapa() {
        const passo = this.passoAtual || 1;
        if (passo <= 1) {
            this.fechar();
            return;
        }
        if (passo === 2) return this.renderizarEtapa1();
        if (passo === 3) return this.renderizarEtapa2();
        if (passo === 4) return this.renderizarEtapa3();
        if (passo === 5) {
            return this.dadosPedido.tipo === 'MATERIAL'
                ? this.renderizarEtapa4()
                : this.renderizarEtapa3();
        }
        if (passo === 6) {
            return this.renderizarSelecaoProdutos(
                this.dadosPedido.tipo === 'MATERIAL'
                    ? this.dadosPedido.setorDML
                    : 'SOLICITACAO_EPI_UNIFORME'
            );
        }
    }
};

window.PublicForm = PublicForm;
