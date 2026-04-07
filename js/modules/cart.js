import { State } from '../core/state.js';

export const Cart = {
    // Adiciona item ao array de estado
    adicionar(nome, variavel, codigo) {
        const setorAtual = State.categoriaAtual;

        // Regra: Limpa carrinho se mudar de setor (Ex: estava em DML e foi para EPI)
        if (State.carrinho.length > 0 && State.carrinho[0].setor !== setorAtual) {
            this.limpar();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Sacola limpa para novo setor',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        }

        // Verifica se item já existe para apenas somar a quantidade
        const itemExistente = State.carrinho.find(item => item.codigo === codigo);

        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            const item = { 
                nome, 
                variavel, 
                codigo, 
                id: Date.now(), 
                quantidade: 1, 
                setor: setorAtual 
            };
            State.carrinho.push(item);
        }

        this.atualizarContador();
        this.renderizar(); // Atualiza a lista visualmente se estiver aberta
        
        // Feedback visual
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: 'Adicionado à sacola'
        });
    },

    alterarQuantidade(id, delta) {
        const item = State.carrinho.find(i => i.id === id);
        if (item) {
            item.quantidade += delta;
            if (item.quantidade <= 0) {
                this.remover(id);
            } else {
                this.atualizarContador();
                this.renderizar();
            }
        }
    },

    remover(id) {
        State.carrinho = State.carrinho.filter(i => i.id !== id);
        this.atualizarContador();
        this.renderizar();
    },

    limpar() {
        State.carrinho = [];
        this.atualizarContador();
        this.renderizar();
    },

    atualizarContador() {
        // Soma a quantidade total de volumes
        const count = State.carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        
        const badge = document.getElementById('contadorCarrinho');
        if (badge) badge.innerText = count;

        // Animação de "pulo" no botão
        const btn = document.querySelector('#botaoCarrinho button');
        if (btn) {
            btn.classList.add('scale-110');
            setTimeout(() => btn.classList.remove('scale-110'), 200);
        }
    },

    // Gera o HTML da lista dentro do carrinho lateral
    renderizar() {
        const lista = document.getElementById('listaCarrinho');
        if (!lista) return;

        if (State.carrinho.length === 0) {
            lista.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-gray-300">
                    <i data-lucide="shopping-bag" class="w-16 h-16 mb-4"></i>
                    <p class="font-bold uppercase tracking-widest text-sm">Sua sacola está vazia</p>
                </div>
            `;
        } else {
            lista.innerHTML = State.carrinho.map(item => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div class="flex-1">
                        <p class="font-black text-zinc-900 uppercase text-sm leading-tight">${item.nome}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${item.variavel}</p>
                        <p class="text-[9px] font-mono text-gray-300 mt-1">COD: ${item.codigo}</p>
                    </div>
                    <div class="flex items-center gap-3 ml-4">
                        <div class="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                            <button onclick="Sistema.alterarQuantidadeCarrinho(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">-</button>
                            <span class="text-xs font-bold text-gray-900 w-6 text-center">${item.quantidade}</span>
                            <button onclick="Sistema.alterarQuantidadeCarrinho(${item.id}, 1)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">+</button>
                        </div>
                        <button onclick="Sistema.removerDoCarrinho(${item.id})" class="w-8 h-8 bg-white border border-red-100 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Atualiza os ícones recém criados
        if (window.lucide) window.lucide.createIcons();
    },

    // Envia para o WhatsApp
    enviarOrdem() {
        if (State.carrinho.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sacola Vazia',
                text: 'Adicione itens antes de enviar.',
                confirmButtonColor: '#F40009',
                customClass: { popup: 'swal2-popup-custom' }
            });
            return;
        }

        const titulo = document.getElementById('tituloPagina') ? document.getElementById('tituloPagina').innerText : "Geral";
        
        let mensagem = "*NOVA SOLICITAÇÃO DE MATERIAL*\n\n";
        mensagem += `*Setor:* ${titulo}\n`;
        mensagem += `*Data:* ${new Date().toLocaleDateString('pt-PT')}\n\n`;
        mensagem += "*Itens Solicitados:*\n";
        
        State.carrinho.forEach((item, index) => {
            mensagem += `${index + 1}. ${item.nome} (${item.variavel}) - Qtd: ${item.quantidade} - Cód: ${item.codigo}\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
        
        this.limpar();
        
        // Fecha o carrinho visualmente (precisa chamar a Navigation ou manipular o DOM direto)
        // Como o Cart não deve importar Navigation para evitar ciclo, faremos via DOM simples ou evento.
        const painel = document.getElementById('carrinhoLateral');
        const corpo = document.getElementById('corpoCarrinho');
        if(painel && corpo) {
             painel.classList.add('opacity-0');
             corpo.classList.add('translate-x-full');
             setTimeout(() => painel.classList.add('hidden'), 500);
        }

        Swal.fire({
            icon: 'success',
            title: 'Solicitação Gerada!',
            text: 'Você será redirecionado para o WhatsApp.',
            timer: 3000,
            showConfirmButton: false,
            customClass: { popup: 'swal2-popup-custom' }
        });
    }
};