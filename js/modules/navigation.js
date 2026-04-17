import { State } from '../core/state.js';
import { Api } from '../services/api.js';
import { Cart } from './cart.js';
import { UI } from './ui.js';

export const Navigation = {
    
    // =================================================
    // 1. FLUXO INICIAL (Login -> Intro -> App)
    // =================================================
    
    iniciarIntro() {
        if (window.Sistema && window.Sistema.preCarregarTudo) {
            window.Sistema.preCarregarTudo();
        }
        this.ativarApp();
        return;
        // --- NOVO: DISPARA O CARREGAMENTO TOTAL ASSIM QUE O VÍDEO COMEÇA ---
        if (window.Sistema && window.Sistema.preCarregarTudo) {
            window.Sistema.preCarregarTudo();
        }
        // -------------------------------------------------------------------

        const intro = document.getElementById("telaIntro");
        const video = document.getElementById("videoIntro");
        
        // Se não tiver vídeo ou tela, pula direto
        if (!intro || !video) {
            this.ativarApp();
            return;
        }

        intro.classList.remove("hidden");
        
        // Segurança: Aumentei para 15s para dar tempo de ver o vídeo e carregar os dados
        State.timerSeguranca = setTimeout(() => this.pularIntro(), 15000);
        
        // Tenta dar play
        State.promessaVideo = video.play();
        if (State.promessaVideo !== undefined) {
            State.promessaVideo.catch(() => this.pularIntro());
        }

        // Quando o vídeo acabar, pula automaticamente
        video.onended = () => this.pularIntro();
    },

    async pularIntro() {
        if (State.timerSeguranca) clearTimeout(State.timerSeguranca);
        
        const intro = document.getElementById("telaIntro");
        const video = document.getElementById("videoIntro");
        
        if (intro) {
            intro.style.opacity = "0";
            setTimeout(() => {
                intro.classList.add("hidden");
                intro.style.display = "none";
                this.ativarApp();
            }, 100);
        }
        
        try {
            if (video && !video.paused) video.pause();
        } catch (e) {}
    },

    ativarApp() {
        const app = document.getElementById("appPrincipal");
        app.classList.remove("hidden");
        
        // Pequeno delay para a transição de opacidade
        setTimeout(() => {
            app.classList.add("opacity-100");
            this.irParaHome();
        }, 50);
        
        // Inicializa ícones
        if (window.lucide) window.lucide.createIcons();
    },

    // =================================================
    // 2. NAVEGAÇÃO DO SISTEMA
    // =================================================

    irParaHome() {
        State.categoriaAtual = "HOME";
        
        document.getElementById("tituloPagina").innerText = "Painel Inicial";
        document.getElementById("containerHome").classList.remove("hidden");
        document.getElementById("filtrosMonitor").classList.add("hidden");
        
        // Limpa grid de ativos para não pesar a memória
        document.getElementById("gradeAtivos").innerHTML = "";
        document.getElementById("vazio").classList.add("hidden");
        document.getElementById("spotlightResults").classList.add("hidden");
        document.getElementById("campoBusca").value = "";
        
        // Reset botão carrinho
        const btnBag = document.getElementById("botaoCarrinho");
        if(btnBag) btnBag.classList.add("translate-y-48");

        // Atualiza widget da home
        Api.atualizarWidgetHome();
        Api.atualizarWidgetCriticos();
    },

    abrirMenu(mostrar) {
        const m = document.getElementById("menuSetores");
        if (!m) return;
        if (mostrar) {
            m.classList.remove("hidden");
            setTimeout(() => m.classList.add("opacity-100"), 50);
            if(window.lucide) window.lucide.createIcons();
        } else {
            m.classList.remove("opacity-100");
            setTimeout(() => m.classList.add("hidden"), 500);
        }
    },

    async selecionarSetor(categoriaID, tituloExibicao) {
        // Atualiza Estado
        State.categoriaAtual = categoriaID;
        
        // Atualiza UI
        document.getElementById("tituloPagina").innerText = tituloExibicao;
        document.getElementById("containerHome").classList.add("hidden");
        document.getElementById("spotlightResults").classList.add("hidden");
        this.abrirMenu(false); // Fecha o menu
        
        const monitorFiltros = document.getElementById("filtrosMonitor");
        const abasCategoria = document.getElementById("abasCategoria");
        const btnBag = document.getElementById("botaoCarrinho");

        // Lógica Específica por Tipo de Setor
        if (categoriaID === "PEDIDOS_LOG") {
            // É o Monitor de Pedidos
            monitorFiltros.classList.remove("hidden");
            if (abasCategoria) abasCategoria.classList.remove("hidden");
            btnBag.classList.add("translate-y-48"); // Esconde carrinho

            await Api.sincronizarPedidos(true); // Chama API para carregar pedidos
            if (window.lucide) window.lucide.createIcons();
        } else {
            // É um Setor de Produtos (DML, EPI...)
            monitorFiltros.classList.add("hidden");
            if (abasCategoria) abasCategoria.classList.add("hidden");
            
            // Verifica mistura de setores no carrinho
            if (State.carrinho.length > 0 && State.carrinho[0].setor !== categoriaID) {
                Cart.limpar();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Sacola limpa para novo setor',
                    timer: 3000,
                    showConfirmButton: false
                });
            }

        // Mantém carrinho oculto nos setores
        btnBag.classList.add("translate-y-48");

            await Api.sincronizarEstoque(); // Chama API para carregar produtos
        }
    },

    alternarCarrinho(mostrar) {
        const painel = document.getElementById('carrinhoLateral');
        const corpo = document.getElementById('corpoCarrinho');
        
        if (mostrar) {
            Cart.renderizar(); // Garante que a lista está atualizada
            painel.classList.remove('hidden');
            setTimeout(() => {
                painel.classList.remove('opacity-0');
                corpo.classList.remove('translate-x-full');
            }, 10);
        } else {
            painel.classList.add('opacity-0');
            corpo.classList.add('translate-x-full');
            setTimeout(() => {
                painel.classList.add('hidden');
            }, 500);
        }
    },
    
    encerrar() {
        // Recarrega a página para fazer logout simples
        try {
            localStorage.removeItem("admin_autenticado");
        } catch (e) {}
        location.reload();
    }
};
