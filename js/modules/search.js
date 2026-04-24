import { State } from '../core/state.js';
import { UI } from './ui.js';

export const Search = {
    normalizar(str) {
        return String(str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    },

    // Função principal chamada pelo <input onkeyup="...">
    processar(termo) {
        const resBox = document.getElementById("spotlightResults");

        // 1. Se estiver dentro de um setor, apenas filtra a grade atual
        if (State.categoriaAtual !== "HOME") {
            this.filtrarGrade(termo);
            resBox.classList.add("hidden");
            return;
        }

        // 2. Se estiver na Home, mostra sugestões (Spotlight)
        if (!termo || termo.length < 2) {
            resBox.classList.add("hidden");
            return;
        }

        const suggestions = [];
        const t = this.normalizar(termo);
        const catalogo = State.catalogoProdutos || [];

        if (catalogo.length === 0) {
            resBox.innerHTML = `
                <div class="spotlight-item animate-entrada-suave">
                    <div class="spotlight-icon-box shadow-sm">
                        <i data-lucide="loader" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div class="text-left text-zinc-900">
                        <p class="text-sm font-black text-gray-900 text-left">Carregando produtos...</p>
                        <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-left">Aguarde alguns segundos</p>
                    </div>
                </div>
            `;
            resBox.classList.remove("hidden");
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        catalogo.forEach((item) => {
            const rootNorm = this.normalizar(item.root);
            const matchRoot = rootNorm.includes(t);
            const matchVar = (item.vars || []).some(
                (v) =>
                    this.normalizar(v.label).includes(t) ||
                    this.normalizar(v.code).includes(t)
            );
            if (!matchRoot && !matchVar) return;

            suggestions.push({
                icon: "package",
                foto: item.f || "",
                title: item.root,
                subtitle: "Abrir produto",
                action: () => {
                    if ((item.vars || []).length > 1) {
                        UI.abrirVariacoesItem(item);
                    } else {
                        const v = (item.vars || [])[0] || { label: "Unidade", code: "" };
                        UI.abrirDetalhesMaterial(item.root, v.label, v.code, item.f, item.sub);
                    }
                },
            });
        });

        this.renderSpotlight(suggestions);
    },

    // Renderiza o dropdown na Home
    renderSpotlight(items) {
        const resBox = document.getElementById("spotlightResults");

        if (items.length === 0) {
            resBox.classList.add("hidden");
            return;
        }

        const escTxt = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        resBox.innerHTML = items.map((item, i) => {
            const visual = item.foto
                ? `<div class="spotlight-icon-box shadow-sm overflow-hidden bg-white p-1"><img src="${escTxt(item.foto)}" class="w-full h-full object-contain rounded-lg" alt="${escTxt(item.title)}" onerror="this.style.display='none';this.parentElement.innerHTML='<i data-lucide=\\'${item.icon}\\' class=\\'w-5 h-5 text-gray-400\\'></i>';if(window.lucide)window.lucide.createIcons();"></div>`
                : `<div class="spotlight-icon-box shadow-sm"><i data-lucide="${item.icon}" class="w-5 h-5 text-gray-400"></i></div>`;
            return `
            <div class="spotlight-item animate-entrada-suave" style="animation-delay: ${i * 0.05}s">
                ${visual}
                <div class="text-left text-zinc-900">
                    <p class="text-sm font-black text-gray-900 text-left">${escTxt(item.title)}</p>
                    <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-left">${escTxt(item.subtitle)}</p>
                </div>
            </div>
            `;
        }).join("");

        // Adiciona eventos de clique
        const els = resBox.querySelectorAll(".spotlight-item");
        items.forEach((item, i) => {
            els[i].onclick = () => {
                item.action();
                resBox.classList.add("hidden");
            };
        });

        resBox.classList.remove("hidden");
        if (window.lucide) window.lucide.createIcons();
    },

    // Filtra os Cards (Produtos ou Pedidos) quando já está dentro do setor
    filtrarGrade(termo) {
        const t = termo.toLowerCase().trim();

        if (State.categoriaAtual === "PEDIDOS_LOG") {
            // Filtrar Pedidos
            const filtrados = State.pedidos.filter(p =>
                p.nome.toLowerCase().includes(t) ||
                p.mat.toLowerCase().includes(t) ||
                p.its.toLowerCase().includes(t)
            );
            UI.renderizarPedidos(true, filtrados);
        } else if (State.categoriaAtual !== "HOME") {
            // Filtrar Produtos (Estoque)
            const filtrados = State.ativos.filter(a =>
                a.root.toLowerCase().includes(t) ||
                a.vars.some(v => v.code.toLowerCase().includes(t))
            );
            UI.renderizarEstoque(filtrados);
        }
    }
};
