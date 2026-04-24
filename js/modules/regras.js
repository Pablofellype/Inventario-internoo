// =================================================================
// REGRAS DE OURO — exibição rotativa nas telas de carregamento
// =================================================================
export const Regras = {
  total: 10,

  // Retorna HTML com o título + uma regra inicial aleatória.
  // Após inserir no DOM, chama _iniciarRotacao para alternar a cada `intervalo`.
  render({ intervalo = 4500, classe = "", titulo = true } = {}) {
    const id = `regras-${Math.random().toString(36).slice(2)}`;
    const inicial = Math.floor(Math.random() * this.total) + 1;
    const dots = Array.from({ length: this.total }, (_, k) => {
      const ativo = k + 1 === inicial;
      return `<span data-dot="${k + 1}" class="w-1.5 h-1.5 rounded-full ${ativo ? "bg-[#F40009]" : "bg-zinc-200"} transition-colors"></span>`;
    }).join("");

    const html = `
      <div id="${id}" data-regras class="${classe} flex flex-col items-center gap-4 w-full max-w-md mx-auto">
        ${titulo ? `<img src="./assets/img/titulo_regra.png" alt="Regras de Ouro" class="w-44 sm:w-56 h-auto select-none pointer-events-none">` : ""}
        <div class="relative w-full">
          <img id="${id}-img" src="./assets/img/regra${inicial}.png" alt="Regra ${inicial}" class="w-full h-auto rounded-2xl shadow-md transition-opacity duration-500" style="opacity:1">
        </div>
        <div class="flex justify-center gap-1.5">${dots}</div>
      </div>`;

    setTimeout(() => this._iniciarRotacao(id, intervalo), 100);
    return html;
  },

  _iniciarRotacao(id, intervalo) {
    const container = document.getElementById(id);
    if (!container) return;
    const img = container.querySelector(`#${id}-img`);
    const dots = container.querySelectorAll("[data-dot]");
    let atual = parseInt(img.alt.replace(/\D/g, ""), 10) || 1;

    const update = (n) => {
      img.style.opacity = "0";
      setTimeout(() => {
        img.src = `./assets/img/regra${n}.png`;
        img.alt = `Regra ${n}`;
        img.style.opacity = "1";
      }, 280);
      dots.forEach((d) => {
        const ativo = parseInt(d.dataset.dot, 10) === n;
        d.classList.toggle("bg-[#F40009]", ativo);
        d.classList.toggle("bg-zinc-200", !ativo);
      });
    };

    const timer = setInterval(() => {
      if (!document.body.contains(container)) {
        clearInterval(timer);
        return;
      }
      atual = (atual % this.total) + 1;
      update(atual);
    }, intervalo);
  },
};
