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
    produtosAtual: [],
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
        this.produtosAtual = [];
        this.passoAtual = 1;
    },

    // =================================================================
    // ETAPA 1: IDENTIFICAÇÃO
    // =================================================================
    renderizarEtapa1() {
        this.atualizarProgresso(1);
        const area = document.getElementById("areaEtapas");
        area.innerHTML = `
        <div>
            <!-- Avatar centralizado -->
            <div class="flex justify-center mb-6 opacity-0 animate-scale-in">
                <div class="relative">
                    <div id="avatarColaborador" class="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-50 border-2 border-zinc-100 text-zinc-300 rounded-full flex items-center justify-center overflow-hidden transition-all duration-700 animate-float">
                        <i data-lucide="user" class="w-9 h-9 sm:w-10 sm:h-10"></i>
                    </div>
                    <div id="badgeVerificado" class="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center border-2 border-white transition-all duration-500">
                        <i data-lucide="scan-face" class="w-3 h-3 text-zinc-400"></i>
                    </div>
                </div>
            </div>

            <!-- Header left-aligned -->
            <div class="mb-6 opacity-0 animate-fade-up" style="animation-delay: 0.06s">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Etapa 01</span>
                </div>
                <h3 class="text-3xl sm:text-4xl font-black text-zinc-900 leading-[0.95] uppercase tracking-tight">Identifique-se</h3>
                <p class="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">Digite seu nome para localizar seu cadastro.</p>
            </div>

            <!-- Campo de busca -->
            <div class="relative mb-4 opacity-0 animate-fade-up z-[100]" style="animation-delay: 0.14s">
                <label class="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-900 mb-2 block">Nome do Colaborador</label>
                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"><i data-lucide="search" class="w-4 h-4"></i></div>
                    <input type="text" id="inputBuscaNome" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" readonly onfocus="this.removeAttribute('readonly')"
                        class="w-full bg-white border-2 border-zinc-200 pl-11 pr-4 py-4 rounded-xl font-bold text-zinc-900 outline-none focus:border-[#F40009] focus:ring-4 focus:ring-red-50 transition-all duration-300 uppercase text-sm placeholder:text-zinc-300 placeholder:normal-case"
                        placeholder="Ex: Maria, João...">
                </div>
                <div id="listaSugestoes" class="hidden absolute top-full left-0 right-0 bg-white border border-zinc-200 shadow-[0_15px_40px_rgba(0,0,0,0.1)] rounded-xl mt-2 max-h-52 overflow-y-auto z-[100] divide-y divide-zinc-50"></div>
            </div>

            <!-- Matrícula (aparece após seleção) -->
            <div class="opacity-0 transition-all duration-700 scale-[0.96] pointer-events-none" id="boxMatricula">
                <label class="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-900 mb-2 block">Matrícula Vinculada</label>
                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"><i data-lucide="hash" class="w-4 h-4"></i></div>
                    <input type="text" id="inputMatriculaAuto" disabled class="w-full bg-zinc-50 border-2 border-zinc-200 pl-11 pr-4 py-4 rounded-xl font-bold text-zinc-400 text-sm" placeholder="Preenchimento automático">
                </div>
            </div>

            <p class="text-[9px] text-zinc-400 mt-3 leading-relaxed opacity-0 animate-fade-up" style="animation-delay: 0.18s">Não encontrou seu nome? Informe seu gestor para que ele atualize seu cadastro.</p>

            <!-- Botão continuar -->
            <button id="btnAvancar1" disabled onclick="PublicForm.renderizarEtapa2()"
                class="mt-8 w-full bg-zinc-100 text-zinc-300 py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-500 cursor-not-allowed flex items-center justify-center gap-2 opacity-0 animate-fade-up" style="animation-delay: 0.22s">
                Continuar <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
            <button onclick="PublicForm.fechar()" class="mt-3 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2 opacity-0 animate-fade-up" style="animation-delay: 0.28s">Cancelar</button>
        </div>`;
        
        const input = document.getElementById("inputBuscaNome");
        const lista = document.getElementById("listaSugestoes");
        input.addEventListener("input", (e) => {
            const termo = e.target.value.toUpperCase();
            // Resetar estado ao digitar
            const boxMat = document.getElementById("boxMatricula");
            const btn = document.getElementById("btnAvancar1");
            const avatarEl = document.getElementById("avatarColaborador");
            const badge = document.getElementById("badgeVerificado");
            boxMat.classList.add("opacity-0", "scale-[0.96]", "pointer-events-none");
            boxMat.classList.remove("opacity-100", "scale-100");
            document.getElementById("inputMatriculaAuto").value = "";
            btn.disabled = true;
            btn.className = "mt-8 w-full bg-zinc-100 text-zinc-300 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-500 cursor-not-allowed flex items-center justify-center gap-2";
            avatarEl.innerHTML = '<i data-lucide="user" class="w-10 h-10 sm:w-11 sm:h-11"></i>';
            avatarEl.classList.remove("shadow-[0_12px_40px_rgba(244,0,9,0.2)]", "ring-4", "ring-emerald-100");
            avatarEl.classList.add("animate-float");
            avatarEl.style.transform = ""; avatarEl.style.opacity = "";
            badge.classList.remove("bg-emerald-500", "animate-scale-in");
            badge.classList.add("bg-zinc-200");
            badge.innerHTML = '<i data-lucide="scan-face" class="w-3.5 h-3.5 text-zinc-400"></i>';
            if(window.lucide) window.lucide.createIcons();
            this.dadosPedido.colaborador = "";
            this.dadosPedido.matricula = "";

            if (termo.length === 0) { lista.classList.add("hidden"); return; }
            const fonteDados = State.colaboradores || [];
            const filtrados = fonteDados.filter(c => c.nome && c.nome.toUpperCase().startsWith(termo));
            if (filtrados.length > 0) {
                lista.innerHTML = filtrados.map((c, idx) => {
                    const avatarSrc = c.imagem ? `<img src="${c.imagem}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<i data-lucide=\\'user\\' class=\\'w-4 h-4\\'></i>';if(window.lucide)window.lucide.createIcons();">` : '<i data-lucide="user" class="w-4 h-4"></i>';
                    return `<div class="px-4 py-3.5 hover:bg-red-50/60 cursor-pointer flex items-center gap-3 group transition-all duration-200 active:bg-red-100 active:scale-[0.98]" data-nome="${encodeURIComponent(c.nome)}" data-mat="${encodeURIComponent(c.matricula)}" onclick="PublicForm.selecionarColaborador(decodeURIComponent(this.dataset.nome), decodeURIComponent(this.dataset.mat))">
                        <div class="w-9 h-9 rounded-full bg-zinc-100 group-hover:bg-red-100 flex items-center justify-center text-zinc-400 group-hover:text-[#F40009] overflow-hidden flex-shrink-0 transition-all duration-200">${avatarSrc}</div>
                        <div class="flex-1 min-w-0"><p class="font-bold text-zinc-900 group-hover:text-[#F40009] text-sm truncate transition-colors">${c.nome}</p></div>
                        <span class="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 group-hover:bg-red-100 group-hover:text-[#F40009] px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors">${c.matricula}</span>
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
        boxMat.classList.remove("opacity-0", "scale-[0.96]", "pointer-events-none");
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
            avatarEl.style.transform = "scale(0.9)";
            avatarEl.style.opacity = "0.5";
            setTimeout(() => {
                avatarEl.innerHTML = `<img src="${colab.imagem}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<i data-lucide=\\'user\\' class=\\'w-10 h-10 sm:w-11 sm:h-11\\'></i>';if(window.lucide)window.lucide.createIcons();">`;
                avatarEl.style.transform = "scale(1)";
                avatarEl.style.opacity = "1";
                avatarEl.classList.add("shadow-[0_12px_40px_rgba(244,0,9,0.2)]", "ring-4", "ring-emerald-100");
                avatarEl.classList.remove("animate-float");
            }, 150);
        }

        // Badge de verificado verde
        if (badge) {
            badge.classList.remove("bg-zinc-200");
            badge.classList.add("bg-emerald-500", "animate-scale-in");
            badge.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>';
        }

        btn.disabled = false;
        btn.className = "mt-8 w-full bg-[#F40009] text-white py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(244,0,9,0.25)] hover:shadow-[0_14px_40px_rgba(244,0,9,0.4)] hover:translate-y-[-2px] active:translate-y-[1px]";
        if(window.lucide) window.lucide.createIcons();
    },

    // =================================================================
    // ETAPA 2: EQUIPE
    // =================================================================
    renderizarEtapa2() {
        this.atualizarProgresso(2);
        document.getElementById("areaEtapas").innerHTML = `
        <div>
            <!-- Header -->
            <div class="mb-7 opacity-0 animate-fade-up">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Etapa 02</span>
                </div>
                <h3 class="text-3xl sm:text-4xl font-black text-zinc-900 leading-[0.95] uppercase tracking-tight">Qual sua<br>equipe?</h3>
                <p class="text-xs text-zinc-400 mt-2">Selecione seu setor de trabalho</p>
            </div>

            <!-- Seção Limpeza -->
            <div class="mb-3 opacity-0 animate-fade-up" style="animation-delay: 0.1s">
                <p class="text-sm font-black text-zinc-900 uppercase tracking-wide">Limpeza</p>
                <div class="w-8 h-[2px] bg-[#F40009] rounded-full mt-1.5"></div>
            </div>
            <div class="grid grid-cols-2 gap-2.5 mb-7">
                <button onclick="PublicForm.selecionarEquipe('DIURNO')" class="group p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer text-left active:scale-[0.97] opacity-0 animate-fade-up flex items-center gap-3" style="animation-delay: 0.15s">
                    <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><i data-lucide="sun" class="w-4.5 h-4.5"></i></div>
                    <div><p class="font-black text-zinc-900 uppercase text-xs leading-tight group-hover:text-[#F40009] transition-colors">Diurno</p><p class="text-[9px] text-zinc-400 mt-0.5">Manhã / Tarde</p></div>
                </button>
                <button onclick="PublicForm.selecionarEquipe('NOTURNO')" class="group p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer text-left active:scale-[0.97] opacity-0 animate-fade-up flex items-center gap-3" style="animation-delay: 0.2s">
                    <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><i data-lucide="moon" class="w-4.5 h-4.5"></i></div>
                    <div><p class="font-black text-zinc-900 uppercase text-xs leading-tight group-hover:text-[#F40009] transition-colors">Noturno</p><p class="text-[9px] text-zinc-400 mt-0.5">Noite</p></div>
                </button>
            </div>

            <!-- Seção Segurança -->
            <div class="mb-3 opacity-0 animate-fade-up" style="animation-delay: 0.25s">
                <p class="text-sm font-black text-zinc-900 uppercase tracking-wide">Segurança Patrimonial</p>
                <div class="w-8 h-[2px] bg-[#F40009] rounded-full mt-1.5"></div>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
                <button onclick="PublicForm.selecionarEquipe('SEGURANCA_DIURNO')" class="group p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer text-left active:scale-[0.97] opacity-0 animate-fade-up flex items-center gap-3" style="animation-delay: 0.3s">
                    <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><i data-lucide="shield" class="w-4.5 h-4.5"></i></div>
                    <div><p class="font-black text-zinc-900 uppercase text-xs leading-tight group-hover:text-[#F40009] transition-colors">Diurno</p><p class="text-[9px] text-zinc-400 mt-0.5">Manhã / Tarde</p></div>
                </button>
                <button onclick="PublicForm.selecionarEquipe('SEGURANCA_NOTURNO')" class="group p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer text-left active:scale-[0.97] opacity-0 animate-fade-up flex items-center gap-3" style="animation-delay: 0.35s">
                    <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><i data-lucide="shield-check" class="w-4.5 h-4.5"></i></div>
                    <div><p class="font-black text-zinc-900 uppercase text-xs leading-tight group-hover:text-[#F40009] transition-colors">Noturno</p><p class="text-[9px] text-zinc-400 mt-0.5">Noite</p></div>
                </button>
            </div>

            <button onclick="PublicForm.fechar()" class="mt-7 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2 opacity-0 animate-fade-up" style="animation-delay: 0.4s">Cancelar</button>
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
                <button onclick="PublicForm.selecionarTipo('MATERIAL')" class="group w-full p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 cursor-pointer flex items-center gap-4 active:scale-[0.97] opacity-0 animate-fade-up" style="animation-delay: 0.22s">
                    <div class="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <img src="./assets/img/material_fundo_trasparente.png" alt="Material" class="w-14 h-14 object-contain">
                    </div>
                    <div class="flex-1"><p class="font-black text-zinc-900 group-hover:text-emerald-600 uppercase text-sm leading-tight transition-colors">Material de Limpeza</p><p class="text-[10px] text-zinc-400 mt-0.5">Produtos e insumos</p></div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 transition-colors"></i>
                </button>`;
        document.getElementById("areaEtapas").innerHTML = `
        <div>
            <div class="mb-7 opacity-0 animate-fade-up">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Etapa 03</span>
                </div>
                <h3 class="text-3xl sm:text-4xl font-black text-zinc-900 leading-[0.95] uppercase tracking-tight">O que deseja<br>solicitar?</h3>
                <p class="text-xs text-zinc-400 mt-2">Escolha a categoria do pedido</p>
            </div>
            <div class="flex flex-col gap-2.5">
                <button onclick="PublicForm.selecionarTipo('SOLICITACAO_EPI_UNIFORME')" class="group w-full p-4 sm:p-5 bg-white border-2 border-zinc-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer flex items-center gap-4 active:scale-[0.97] opacity-0 animate-fade-up" style="animation-delay: 0.12s">
                    <div class="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><img src="./assets/img/epi_fundo_trasparente.png" alt="EPI" class="w-14 h-14 object-contain"></div>
                    <div class="flex-1"><p class="font-black text-zinc-900 group-hover:text-blue-600 uppercase text-sm leading-tight transition-colors">EPI & Uniforme</p><p class="text-[10px] text-zinc-400 mt-0.5">Equipamentos e roupas</p></div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors"></i>
                </button>
                ${botaoMaterial}
            </div>
            <button onclick="PublicForm.fechar()" class="mt-7 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2 opacity-0 animate-fade-up" style="animation-delay: 0.32s">Cancelar</button>
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
        const botoes = locais.map((l, i) => `
            <button onclick="PublicForm.finalizarDML('${l.id}')" class="group w-full p-4 bg-white border-2 border-zinc-200 rounded-xl flex items-center gap-3.5 hover:border-[#F40009] hover:bg-red-50/30 transition-all duration-200 cursor-pointer active:scale-[0.97] opacity-0 animate-fade-up" style="animation-delay: ${0.12 + i * 0.06}s">
                <div class="w-10 h-10 ${l.cor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><i data-lucide="${l.icon}" class="w-4.5 h-4.5"></i></div>
                <span class="font-black text-zinc-900 group-hover:text-[#F40009] uppercase text-xs sm:text-sm transition-colors flex-1">${l.nome}</span>
                <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-300 group-hover:text-[#F40009] transition-colors"></i>
            </button>`).join("");

        document.getElementById("areaEtapas").innerHTML = `
        <div>
            <div class="mb-7 opacity-0 animate-fade-up">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Etapa 04</span>
                </div>
                <h3 class="text-3xl sm:text-4xl font-black text-zinc-900 leading-[0.95] uppercase tracking-tight">Qual local?</h3>
                <p class="text-xs text-zinc-400 mt-2">Selecione para onde é o material</p>
            </div>
            <div class="flex flex-col gap-2.5">${botoes}</div>
            <button onclick="PublicForm.fechar()" class="mt-7 w-full text-zinc-400 font-bold text-[11px] uppercase tracking-wider hover:text-[#F40009] transition-colors py-2 opacity-0 animate-fade-up" style="animation-delay: 0.5s">Cancelar</button>
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
        this.atualizarProgresso(5);
        const area = document.getElementById("areaEtapas");
        area.innerHTML = `<div class="text-center py-16 sm:py-20"><div class="w-12 h-12 border-[3px] border-zinc-100 border-t-[#F40009] rounded-full animate-spin mx-auto"></div><p class="mt-5 text-[11px] font-black uppercase text-zinc-400 tracking-widest">Carregando Itens...</p></div>`;

        // Sempre busca dados frescos da planilha para garantir atualizações
        await Api.preCarregarTudo();
        let produtos = await Cache.carregar(categoriaID);
        if (!produtos || produtos.length === 0) {
            produtos = [];
        }

        const acaoVoltar = this.dadosPedido.tipo === 'MATERIAL' ? 'PublicForm.renderizarEtapa4()' : 'PublicForm.renderizarEtapa3()';

        if (!produtos || produtos.length === 0) {
            area.innerHTML = `<div class="text-center py-20"><p class="text-gray-400">Nenhum item encontrado.</p><button onclick="${acaoVoltar}" class="mt-4 text-[#F40009] font-bold underline">Voltar</button></div>`;
            return;
        }

        this.produtosAtual = produtos;

        let htmlLista = `
        <div class="pb-24">
            <div class="mb-6 opacity-0 animate-fade-up">
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Seleção</span>
                </div>
                <h3 class="text-2xl sm:text-3xl font-black text-zinc-900 uppercase leading-[0.95] tracking-tight truncate">${categoriaID.replace('_', ' ').replace('SOLICITACAO', '')}</h3>
                <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1.5">Selecione os itens e quantidades</p>
            </div>

            <div class="grid grid-cols-2 gap-2.5 sm:gap-3">`;

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

            const delay = Math.min(index * 0.06, 0.6);

            if (temVariacao) {
                const totalVars = prod.vars.reduce((acc, v) => acc + (this.carrinhoTemp[v.code]?.qtd || 0), 0);
                const badgeHTML = `<div id="badge-${safeRoot}" class="absolute top-1.5 right-1.5 w-6 h-6 bg-[#F40009] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg z-10 ${totalVars > 0 ? 'animate-scale-in' : 'hidden'}">${totalVars}</div>`;

                // Montar resumo das variações selecionadas
                const varsSelected = prod.vars.filter(v => (this.carrinhoTemp[v.code]?.qtd || 0) > 0);
                let footerHTML = "";
                if (varsSelected.length > 0) {
                    const resumoTags = varsSelected.map(v => {
                        const q = this.carrinhoTemp[v.code].qtd;
                        return `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase shadow-sm"><i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>${v.label} ×${q}</span>`;
                    }).join(" ");
                    footerHTML = `
                    <div id="resumo-${safeRoot}" class="w-full mt-auto">
                        <div class="flex flex-wrap gap-1 justify-center mb-2">${resumoTags}</div>
                        <button onclick="PublicForm.abrirVariacoes(${index})" class="w-full bg-zinc-900 text-white rounded-lg py-2 font-black uppercase text-[9px] tracking-wider hover:bg-zinc-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5">
                            <i data-lucide="pencil-line" class="w-3 h-3"></i> Editar seleção
                        </button>
                    </div>`;
                } else {
                    footerHTML = `
                    <div id="resumo-${safeRoot}" class="w-full mt-auto">
                        <button onclick="PublicForm.abrirVariacoes(${index})" class="w-full bg-zinc-900 text-white rounded-lg py-2.5 font-black uppercase text-[10px] tracking-wider hover:bg-[#F40009] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Adicionar
                        </button>
                    </div>`;
                }

                htmlLista += `
                <div class="bg-white p-2.5 sm:p-3 rounded-xl border-2 ${varsSelected.length > 0 ? 'border-emerald-200' : 'border-zinc-100'} flex flex-col items-center text-center relative group hover:border-zinc-200 transition-all duration-200 opacity-0 animate-fade-up" style="animation-delay: ${delay}s">
                    ${badgeHTML}
                    <div class="relative w-full aspect-square mb-2 cursor-zoom-in overflow-hidden rounded-lg bg-zinc-50" onclick="PublicForm.verFotoGrande(this)" data-foto="${encodeURIComponent(prod.f)}" data-nome="${encodeURIComponent(prod.root)}">
                        <img src="${prod.f}" onerror="this.src='assets/img/placeholder.png'" class="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute bottom-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200"><i data-lucide="maximize-2" class="w-3 h-3"></i></div>
                    </div>
                    <p class="text-[9px] sm:text-[10px] font-bold text-zinc-700 leading-tight h-7 sm:h-8 overflow-hidden line-clamp-2 uppercase mb-2 w-full px-0.5">${prod.root}</p>
                    ${footerHTML}
                    ${prod.max > 0 ? `<p class="text-[8px] text-zinc-400 mt-1 text-center font-bold">Máx: ${prod.max} un.</p>` : ''}
                </div>`;
                return;
            } else if (eUnico) {
                codigoInicial = prod.vars[0].code;
                labelInicial = prod.vars[0].label;
                quantidadeInicial = this.carrinhoTemp[codigoInicial]?.qtd || 0;
                seletorHTML = `<input type="hidden" id="sel-${safeRoot}" value="${codigoInicial}" data-label="${labelInicial}" data-has-vars="false"><div class="h-2"></div>`;
            } else {
                codigoInicial = prod.vars[0].code;
                labelInicial = prod.vars[0].label;
                quantidadeInicial = this.carrinhoTemp[codigoInicial]?.qtd || 0;
                seletorHTML = `<input type="hidden" id="sel-${safeRoot}" value="${codigoInicial}" data-label="${labelInicial}" data-has-vars="false"><div class="w-full mb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 py-1.5 rounded-lg">TAM: ${labelInicial}</div>`;
            }

            htmlLista += `
            <div id="card-${safeRoot}" class="bg-white p-2.5 sm:p-3 rounded-xl border-2 ${quantidadeInicial > 0 ? 'border-emerald-200' : 'border-zinc-100'} flex flex-col items-center text-center relative group hover:border-zinc-200 transition-all duration-200 opacity-0 animate-fade-up" style="animation-delay: ${delay}s">
                <div class="relative w-full aspect-square mb-2 cursor-zoom-in overflow-hidden rounded-lg bg-zinc-50" onclick="PublicForm.verFotoGrande(this)" data-foto="${encodeURIComponent(prod.f)}" data-nome="${encodeURIComponent(prod.root)}">
                    <img src="${prod.f}" onerror="this.src='assets/img/placeholder.png'" class="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute bottom-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200"><i data-lucide="maximize-2" class="w-3 h-3"></i></div>
                </div>

                <p class="text-[9px] sm:text-[10px] font-bold text-zinc-700 leading-tight h-7 sm:h-8 overflow-hidden line-clamp-2 uppercase mb-2 w-full px-0.5">${prod.root}</p>
                ${seletorHTML}

                <div class="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 rounded-lg p-1.5 w-full justify-between mt-auto border border-zinc-100">
                    <button onclick="PublicForm.clickCounter('${safeRoot}', '${prod.root.replace(/'/g, "\\'")}', -1, ${index})" class="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-md text-zinc-400 font-bold hover:text-[#F40009] active:scale-90 transition-all duration-200 text-base sm:text-lg border border-zinc-100">-</button>
                    <span id="display-${safeRoot}" class="font-black text-sm text-zinc-900 min-w-[20px] transition-all duration-200">${quantidadeInicial}</span>
                    <button onclick="PublicForm.clickCounter('${safeRoot}', '${prod.root.replace(/'/g, "\\'")}', 1, ${index})" class="w-7 h-7 sm:w-8 sm:h-8 bg-zinc-900 rounded-md text-white font-bold hover:bg-[#F40009] active:scale-90 transition-all duration-200 text-base sm:text-lg">+</button>
                </div>
                ${prod.max > 0 ? `<p class="text-[8px] text-zinc-400 mt-1.5 text-center font-bold">Máx: ${prod.max} un.</p>` : ''}
            </div>`;
        });

        htmlLista += `</div>
        <div id="barradeConclusao" class="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] hidden animate-emergir z-40 mt-4 rounded-xl border border-zinc-200">
            <div class="w-full flex justify-between items-center gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0"><i data-lucide="shopping-bag" class="w-4.5 h-4.5 text-white"></i></div>
                    <div><p class="text-[9px] text-zinc-400 uppercase font-bold tracking-wider leading-none">Itens</p><p id="totalItensResumo" class="text-lg font-black text-zinc-900 leading-tight">0</p></div>
                </div>
                <button onclick="PublicForm.revisarPedido()" class="bg-[#F40009] text-white px-6 sm:px-8 py-3 rounded-lg font-black uppercase tracking-wider text-xs sm:text-sm shadow-[0_8px_25px_rgba(244,0,9,0.25)] hover:shadow-[0_14px_40px_rgba(244,0,9,0.4)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-200 flex items-center gap-2">
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

    abrirVariacoes(prodIndex) {
        const prod = this.produtosAtual[prodIndex];
        if (!prod) return;
        const safeRoot = `prod-${prodIndex}`;

        const varLinhas = prod.vars.map((v, vi) => {
            const varKey = `modal-var-${prodIndex}-${vi}`;
            const qtd = this.carrinhoTemp[v.code]?.qtd || 0;
            return `
            <div class="flex items-center justify-between py-3.5 ${vi < prod.vars.length - 1 ? 'border-b border-zinc-100/80' : ''} opacity-0 animate-fade-up" style="animation-delay: ${0.1 + vi * 0.05}s">
                <span class="text-xs font-bold text-zinc-700 uppercase tracking-wide">${v.label}</span>
                <div class="flex items-center gap-2.5">
                    <button onclick="PublicForm.clickCounterVar('${v.code}', '${prod.root.replace(/'/g, "\\'")}', '${v.label.replace(/'/g, "\\'")}', -1, '${varKey}', ${prodIndex})" class="w-9 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-400 font-bold hover:text-[#F40009] hover:border-red-200 active:scale-90 transition-all duration-200 text-lg flex items-center justify-center">-</button>
                    <span id="display-${varKey}" class="font-black text-base text-zinc-900 min-w-[28px] text-center transition-all duration-200">${qtd}</span>
                    <button onclick="PublicForm.clickCounterVar('${v.code}', '${prod.root.replace(/'/g, "\\'")}', '${v.label.replace(/'/g, "\\'")}', 1, '${varKey}', ${prodIndex})" class="w-9 h-9 bg-zinc-900 rounded-xl text-white font-bold hover:bg-[#F40009] active:scale-90 transition-all duration-200 text-lg flex items-center justify-center">+</button>
                </div>
            </div>`;
        }).join('');

        const modal = document.createElement("div");
        modal.id = "modalVariacoes";
        modal.className = "fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in";
        modal.onclick = (e) => { if (e.target === modal) PublicForm.fecharModalVariacoes(prodIndex); };
        modal.innerHTML = `
        <div class="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-up sm:animate-scale-in" onclick="event.stopPropagation()">
            <div class="w-10 h-1 bg-zinc-300 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>
            <div class="p-5 flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-lg bg-zinc-50 border-2 border-zinc-100 p-1.5 flex-shrink-0">
                    <img src="${prod.f}" onerror="this.src='assets/img/placeholder.png'" class="w-full h-full rounded-md object-contain">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-black text-zinc-900 text-sm uppercase truncate">${prod.root}</p>
                    <p class="text-[10px] text-zinc-400 font-bold uppercase mt-0.5 tracking-wide">${prod.max > 0 ? `Máximo: ${prod.max} unidade${prod.max > 1 ? 's' : ''} no total` : 'Variações e quantidades'}</p>
                </div>
                <button onclick="PublicForm.fecharModalVariacoes(${prodIndex})" class="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-[#F40009] transition-all duration-200 flex-shrink-0 active:scale-90">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="px-5 pb-2 max-h-[50vh] overflow-y-auto">
                ${varLinhas}
            </div>
            <div class="p-5 pt-3">
                <button onclick="PublicForm.fecharModalVariacoes(${prodIndex})" class="w-full bg-[#F40009] text-white py-3.5 rounded-lg font-black uppercase text-xs tracking-wider shadow-[0_8px_25px_rgba(244,0,9,0.25)] hover:shadow-[0_14px_40px_rgba(244,0,9,0.4)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2">
                    <i data-lucide="check" class="w-4 h-4"></i> Confirmar
                </button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    },

    clickCounterVar(codigo, rootName, labelVar, delta, varKey, prodIndex) {
        const labelUpper = labelVar.toUpperCase();
        let nomeFinal = rootName;
        if (labelUpper !== "UNICO" && labelUpper !== "ÚNICO" && labelUpper !== "UNIDADE") {
            nomeFinal = `${rootName} [${labelVar}]`;
        }

        // Verifica limite máximo considerando TODAS as variações do produto
        const prod = prodIndex !== undefined ? this.produtosAtual[prodIndex] : null;
        const max = prod?.max || 0;
        if (max > 0 && delta > 0 && prod) {
            const totalAtual = prod.vars.reduce((acc, v) => acc + (this.carrinhoTemp[v.code]?.qtd || 0), 0);
            if (totalAtual >= max) {
                this.mostrarAvisoMax(varKey, max);
                return;
            }
        }

        this.alterarQtd(codigo, nomeFinal, delta, 0);
        const display = document.getElementById(`display-${varKey}`);
        const qtd = this.carrinhoTemp[codigo] ? this.carrinhoTemp[codigo].qtd : 0;
        display.innerText = qtd;
        display.classList.add("text-[#F40009]", "scale-125");
        setTimeout(() => display.classList.remove("text-[#F40009]", "scale-125"), 200);

        // Atualiza badge no card
        if (prodIndex !== undefined) {
            if (prod) {
                const totalVars = prod.vars.reduce((acc, v) => acc + (this.carrinhoTemp[v.code]?.qtd || 0), 0);
                const badge = document.getElementById(`badge-prod-${prodIndex}`);
                if (badge) {
                    badge.innerText = totalVars;
                    if (totalVars > 0) badge.classList.remove("hidden");
                    else badge.classList.add("hidden");
                }
            }
        }
    },

    fecharModalVariacoes(prodIndex) {
        const modal = document.getElementById('modalVariacoes');
        if (modal) modal.remove();
        this.atualizarResumoCard(prodIndex);
    },

    atualizarResumoCard(prodIndex) {
        const prod = this.produtosAtual[prodIndex];
        if (!prod) return;
        const safeRoot = `prod-${prodIndex}`;
        const resumoEl = document.getElementById(`resumo-${safeRoot}`);
        if (!resumoEl) return;

        const varsSelected = prod.vars.filter(v => (this.carrinhoTemp[v.code]?.qtd || 0) > 0);
        const totalVars = prod.vars.reduce((acc, v) => acc + (this.carrinhoTemp[v.code]?.qtd || 0), 0);

        // Atualiza a borda do card
        const card = resumoEl.closest('.bg-white');
        if (card) {
            if (varsSelected.length > 0) {
                card.classList.remove('border-zinc-100');
                card.classList.add('border-emerald-200');
            } else {
                card.classList.remove('border-emerald-200');
                card.classList.add('border-zinc-100');
            }
        }

        if (varsSelected.length > 0) {
            const resumoTags = varsSelected.map(v => {
                const q = this.carrinhoTemp[v.code].qtd;
                return `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase shadow-sm"><i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>${v.label} ×${q}</span>`;
            }).join(" ");
            resumoEl.innerHTML = `
                <div class="flex flex-wrap gap-1 justify-center mb-2">${resumoTags}</div>
                <button onclick="PublicForm.abrirVariacoes(${prodIndex})" class="w-full bg-zinc-900 text-white rounded-lg py-2 font-black uppercase text-[9px] tracking-wider hover:bg-zinc-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5">
                    <i data-lucide="pencil-line" class="w-3 h-3"></i> Editar seleção
                </button>`;
        } else {
            resumoEl.innerHTML = `
                <button onclick="PublicForm.abrirVariacoes(${prodIndex})" class="w-full bg-zinc-900 text-white rounded-lg py-2.5 font-black uppercase text-[10px] tracking-wider hover:bg-[#F40009] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> Adicionar
                </button>`;
        }

        // Atualiza badge
        const badge = document.getElementById(`badge-${safeRoot}`);
        if (badge) {
            badge.innerText = totalVars;
            if (totalVars > 0) { badge.classList.remove("hidden"); badge.classList.add("animate-scale-in"); }
            else badge.classList.add("hidden");
        }

        if (window.lucide) window.lucide.createIcons();
    },

    clickCounter(safeRoot, rootName, delta, prodIndex) {
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

        const prod = prodIndex !== undefined ? this.produtosAtual[prodIndex] : null;
        const max = prod?.max || 0;
        const ok = this.alterarQtd(codigo, nomeFinal, delta, max);
        if (!ok) {
            this.mostrarAvisoMax(safeRoot, max);
            return;
        }
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

        // Atualiza borda verde do card
        const card = document.getElementById(`card-${safeRoot}`);
        if (card) {
            if (qtdAtual > 0) {
                card.classList.remove('border-zinc-100');
                card.classList.add('border-emerald-200');
            } else {
                card.classList.remove('border-emerald-200');
                card.classList.add('border-zinc-100');
            }
        }
    },

    alterarQtd(codigo, nome, delta, max) {
        if (!this.carrinhoTemp[codigo]) { this.carrinhoTemp[codigo] = { nome: nome, qtd: 0 }; }
        const novaQtd = this.carrinhoTemp[codigo].qtd + delta;
        if (max > 0 && novaQtd > max) return false;
        this.carrinhoTemp[codigo].qtd = novaQtd;
        if (this.carrinhoTemp[codigo].qtd < 0) this.carrinhoTemp[codigo].qtd = 0;
        if (this.carrinhoTemp[codigo].qtd === 0) delete this.carrinhoTemp[codigo];
        this.atualizarBotaoConcluir();
        return true;
    },

    mostrarAvisoMax(elementId, max) {
        const display = document.getElementById(`display-${elementId}`);
        if (display) {
            display.classList.add("text-[#F40009]", "scale-125");
            setTimeout(() => display.classList.remove("scale-125"), 300);
        }
        // Toast rápido
        const toast = document.createElement("div");
        toast.className = "fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-zinc-900 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in";
        toast.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-[#F40009]"></i> Máximo permitido: ${max} unidade${max > 1 ? 's' : ''}`;
        document.body.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity 0.3s"; setTimeout(() => toast.remove(), 300); }, 2000);
    },

    atualizarBotaoConcluir() {
        const barra = document.getElementById("barradeConclusao");
        const totalSpan = document.getElementById("totalItensResumo");
        const totalItens = Object.values(this.carrinhoTemp).reduce((acc, item) => acc + item.qtd, 0);
        if (totalSpan) totalSpan.innerText = totalItens;
        if (totalItens > 0) barra.classList.remove("hidden");
        else barra.classList.add("hidden");
    },

    verFotoGrande(el) {
        const url = decodeURIComponent(el.dataset.foto);
        const nome = decodeURIComponent(el.dataset.nome);
        const modal = document.createElement("div");
        modal.className = "fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-entrada-suave cursor-zoom-out";
        modal.onclick = () => modal.remove();
        const inner = document.createElement("div");
        inner.className = "relative max-w-full max-h-full";
        inner.onclick = (e) => e.stopPropagation();
        const img = document.createElement("img");
        img.src = url;
        img.className = "max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain";
        const label = document.createElement("p");
        label.className = "text-white/80 text-center mt-3 font-bold uppercase text-xs tracking-widest";
        label.textContent = nome;
        const btn = document.createElement("button");
        btn.className = "absolute -top-3 -right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors";
        btn.innerHTML = `<i data-lucide="x" class="w-4 h-4"></i>`;
        btn.onclick = () => modal.remove();
        inner.append(img, label, btn);
        modal.appendChild(inner);
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
                <!-- Header -->
                <div class="mb-6">
                    <div class="flex items-center gap-2.5 mb-3">
                        <div class="h-[2px] w-8 bg-[#F40009] rounded-full"></div>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Revisão</span>
                    </div>
                    <h3 class="text-3xl sm:text-4xl font-black text-zinc-900 leading-[0.95] uppercase tracking-tight">Confirme<br>seu pedido</h3>
                    <p class="text-xs text-zinc-400 mt-2">Verifique se tudo está correto antes de enviar</p>
                </div>

                <!-- Colaborador -->
                <div class="bg-white border-2 border-zinc-200 rounded-xl p-4 sm:p-5 mb-2.5">
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center text-zinc-300 flex-shrink-0">${avatarHtml}</div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Colaborador</p>
                            <p class="font-black text-base text-zinc-900 leading-tight mt-0.5 truncate">${this.dadosPedido.colaborador}</p>
                        </div>
                        <span class="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-100 flex-shrink-0">${this.dadosPedido.matricula}</span>
                    </div>
                </div>

                <!-- Equipe e DML -->
                <div class="flex gap-2.5 mb-2.5">
                    <div class="bg-white border-2 border-zinc-200 rounded-xl p-3.5 flex-1">
                        <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Equipe</p>
                        <p class="font-black text-sm text-zinc-900 mt-0.5 uppercase">${this.dadosPedido.equipe.replace('_', ' ')}</p>
                    </div>
                    ${this.dadosPedido.setorDML ? `<div class="bg-white border-2 border-zinc-200 rounded-xl p-3.5 flex-1">
                        <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Local</p>
                        <p class="font-black text-sm text-zinc-900 mt-0.5 uppercase">${this.dadosPedido.setorDML.replace('DML_', '').replace('_', ' ')}</p>
                    </div>` : ''}
                </div>

                <!-- Itens -->
                <div class="bg-white border-2 border-zinc-200 rounded-xl p-4 sm:p-5 mb-7">
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Itens Solicitados</p>
                        <span class="text-[10px] font-black text-white bg-zinc-900 px-2.5 py-0.5 rounded-md">${totalItens}</span>
                    </div>
                    ${itensHtml}
                </div>

                <button id="btnEnviarFinal" onclick="PublicForm.concluirSolicitacao()"
                    class="w-full bg-[#F40009] text-white py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm shadow-[0_8px_25px_rgba(244,0,9,0.25)] hover:shadow-[0_14px_40px_rgba(244,0,9,0.4)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2">
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
        <div id="modalSolicitacao" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5 animate-fade-in">
            <div class="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-[0_-10px_60px_rgba(0,0,0,0.15)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-slide-up sm:animate-scale-in overflow-hidden">
                <div class="w-10 h-1 bg-zinc-300 rounded-full mx-auto mt-3 sm:hidden"></div>
                <div class="p-6 sm:p-8 text-center">
                    <div class="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_25px_rgba(16,185,129,0.3)]">
                        <i data-lucide="check" class="w-8 h-8 text-white"></i>
                    </div>
                    <h3 class="text-xl font-black text-zinc-900 leading-tight mb-1">Pedido Enviado!</h3>
                    <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Registrado com sucesso</p>

                    <div class="bg-zinc-900 rounded-xl p-4 mt-5 mb-4">
                        <p class="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Protocolo</p>
                        <p class="text-xl font-mono font-black text-white tracking-wider">${idUnico}</p>
                    </div>

                    <div class="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-6">
                        <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
                        </div>
                        <p class="text-[11px] text-amber-700 font-bold leading-snug text-left">Até <span class="font-black">48 horas</span> para atualização do status.</p>
                    </div>

                    <button onclick="PublicForm.novoPedido()" class="w-full bg-[#F40009] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_8px_25px_rgba(244,0,9,0.25)] hover:shadow-[0_14px_40px_rgba(244,0,9,0.4)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Novo Pedido
                    </button>
                    <button onclick="PublicForm.finalizarModal()" class="mt-3 w-full text-zinc-400 font-bold text-[10px] uppercase tracking-[0.15em] hover:text-zinc-600 transition-colors py-2">
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
