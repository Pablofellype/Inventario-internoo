// =================================================================
// REGRAS DE OURO — Splash cinematográfico + Banner + Galeria
// 4 trios: [1,2,3] [4,5,6] [7,8,9] [10 NOVA]
// =================================================================
export const Regras = {
  total: 10,
  slides: [
    { numeros: [1, 2, 3], titulo: "Regras 1 · 2 · 3" },
    { numeros: [4, 5, 6], titulo: "Regras 4 · 5 · 6" },
    { numeros: [7, 8, 9], titulo: "Regras 7 · 8 · 9" },
    { numeros: [10],      titulo: "Nova · Regra 10",  isNova: true },
  ],

  foiVista() { try { return sessionStorage.getItem("regras_vistas") === "1"; } catch { return false; } },
  marcarVista() { try { sessionStorage.setItem("regras_vistas", "1"); } catch {} },

  // ---------- HTML do slide cinematográfico ----------
  _slideHTML(slide, idx) {
    const total = this.slides.length;
    const isNova = !!slide.isNova;
    const accent = isNova ? "#f59e0b" : "#F40009";
    const ativoIni = slide.numeros[0];

    const thumbs = slide.numeros.map((n, i) => `
      <button data-thumb="${n}" class="rg-thumb ${i === 0 ? "rg-thumb-ativo" : ""}" style="--accent:${accent};animation-delay:${0.45 + i * 0.08}s">
        <img src="./assets/img/regra${n}.png" alt="Regra ${n}" loading="lazy">
        <span class="rg-thumb-num">${n}</span>
      </button>
    `).join("");

    const idxAnterior = (idx - 1 + total) % total;
    const idxProximo = (idx + 1) % total;
    const slidePrev = this.slides[idxAnterior];
    const slideNext = this.slides[idxProximo];

    return `
      <div class="rg-slide" data-trio-idx="${idx}" data-numeros="${slide.numeros.join(',')}">
        <div class="rg-trio-badge" style="--accent:${accent}">
          <span class="rg-trio-pulse"></span>
          ${slide.titulo}
        </div>

        <div class="rg-stage">
          <button data-trio-prev class="rg-trio-nav rg-prev" title="Trio anterior · ${slidePrev.titulo}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <img id="rg-img-grande-${idx}" src="./assets/img/regra${ativoIni}.png" class="rg-img-grande" alt="Regra ${ativoIni}">
          <button data-trio-next class="rg-trio-nav rg-next" title="Próximo trio · ${slideNext.titulo}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        ${slide.numeros.length > 1 ? `<div class="rg-thumbs" style="--accent:${accent}">${thumbs}</div>` : ""}
      </div>`;
  },

  _dotsHTML(idxAtivo) {
    return this.slides.map((s, k) => {
      const ativo = k === idxAtivo;
      const cor = s.isNova ? "var(--rg-amber)" : "var(--rg-red)";
      return `<button data-dot="${k}" class="rg-dot ${ativo ? "rg-dot-ativo" : ""}" style="--cor:${cor}" title="${s.titulo}"></button>`;
    }).join("");
  },

  _styles() {
    return `
      <style>
        /* Bloqueia scroll dentro do SwAl */
        .swal2-popup.regras-splash-popup,
        .swal2-popup.regras-splash-popup .swal2-html-container {
          overflow: hidden !important; max-height: 100dvh !important;
        }
        .swal2-popup.regras-splash-popup .swal2-html-container { padding: 0 !important; margin: 0 !important; }
        .swal2-container.regras-splash-container { overflow: hidden !important; }

        .rg-root { --rg-red:#F40009; --rg-amber:#f59e0b; --rg-dark:#0f172a; background:#fff; overflow:hidden; width: 100%; }
        .rg-shell { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; }

        .rg-header { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 0 8px; }
        .rg-title { width: 180px; height: auto; max-width: 75%; opacity: 0; animation: rgFadeDown 0.6s ease 0.05s forwards; }
        @media (min-width:640px) { .rg-title { width: 360px; } .rg-header { gap: 10px; padding: 4px 0 12px; } }
        .rg-sub { display: none; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #71717a; opacity: 0; animation: rgFadeDown 0.6s ease 0.15s forwards; }
        @media (min-width:640px) { .rg-sub { display: block; } }

        .rg-slide { display: flex; flex-direction: column; height: 100%; gap: 12px; }
        .rg-trio-badge {
          align-self: center; display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 10%, white);
          color: var(--accent); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
          opacity: 0; animation: rgFadeDown 0.5s ease 0.25s forwards;
        }
        .rg-trio-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 0 var(--accent); animation: rgPulse 1.6s infinite; }
        @keyframes rgPulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent); } 100% { box-shadow: 0 0 0 12px transparent; } }

        .rg-stage { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; min-height: 0; padding: 0 48px; position: relative; }
        .rg-img-grande {
          width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain;
          border-radius: 14px; box-shadow: 0 18px 40px -18px rgba(0,0,0,0.18);
          transform: scale(0.92); opacity: 0; animation: rgZoomIn 0.55s cubic-bezier(0.16,1,0.3,1) 0.32s forwards;
          transition: opacity 0.25s ease;
          display: block;
        }
        .rg-img-grande.rg-trocando { opacity: 0; transform: scale(0.96); }

        /* Setas pra navegar entre TRIOS — sempre visíveis */
        .rg-trio-nav {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 20;
          width: 42px; height: 42px; border-radius: 50%;
          background: white; border: 2px solid #e4e4e7;
          display: flex; align-items: center; justify-content: center;
          color: #18181b; cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.10);
        }
        .rg-trio-nav:hover { background: #F40009; color: white; border-color: #F40009; transform: translateY(-50%) scale(1.08); box-shadow: 0 10px 22px rgba(244,0,9,0.30); }
        .rg-trio-nav:active { transform: translateY(-50%) scale(0.94); }
        .rg-trio-nav.rg-prev { left: 4px; }
        .rg-trio-nav.rg-next { right: 4px; }
        .rg-trio-nav-label {
          position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
          font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px;
          color: #71717a; white-space: nowrap; pointer-events: none;
        }
        @media (min-width:640px) { .rg-trio-nav { width: 48px; height: 48px; } }

        .rg-thumbs { flex-shrink: 0; display: flex; justify-content: center; gap: 8px; padding: 0 12px; }
        .rg-thumb {
          position: relative; flex: 1 1 0; max-width: 80px; aspect-ratio: 1/1;
          background: white; border: 2px solid #e4e4e7; border-radius: 12px; padding: 3px;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          opacity: 0; transform: translateY(14px) scale(0.9);
          animation: rgThumbIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
          box-shadow: 0 4px 10px rgba(0,0,0,0.04);
        }
        @media (min-width:640px) { .rg-thumb { max-width: 110px; padding: 4px; border-radius: 14px; } .rg-thumbs { gap: 10px; } }
        .rg-thumb img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; pointer-events: none; }
        .rg-thumb-num {
          position: absolute; top: -6px; right: -6px;
          background: white; color: var(--accent); font-size: 9px; font-weight: 900;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .rg-thumb:hover { border-color: var(--accent); transform: translateY(-2px); }
        .rg-thumb-ativo { border-color: var(--accent); transform: scale(1.04); box-shadow: 0 8px 18px color-mix(in srgb, var(--accent) 25%, transparent); }
        .rg-thumb-ativo .rg-thumb-num { background: var(--accent); color: white; }

        .rg-footer { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 8px; }
        @media (min-width:640px) { .rg-footer { gap: 14px; padding-top: 12px; } }
        .rg-dots { display: flex; align-items: center; gap: 10px; opacity: 0; animation: rgFadeUp 0.4s ease 0.6s forwards; }
        .rg-dot { width: 8px; height: 8px; border-radius: 50%; background: #d4d4d8; border: none; cursor: pointer; transition: all 0.25s ease; padding: 0; }
        .rg-dot:hover { background: #a1a1aa; }
        .rg-dot-ativo { width: 28px; border-radius: 999px; background: var(--cor); }

        .rg-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; width: 100%; max-width: 480px; opacity: 0; animation: rgFadeUp 0.4s ease 0.7s forwards; }
        @media (min-width:640px) { .rg-actions { gap: 10px; } }
        .rg-btn { padding: 12px; border-radius: 16px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; border: none; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        @media (min-width:640px) { .rg-btn { padding: 16px; font-size: 12px; letter-spacing: 2px; gap: 8px; } }
        .rg-btn-pular { background: transparent; color: #71717a; border: 2px solid #e4e4e7; }
        .rg-btn-pular:hover { background: #f4f4f5; color: #18181b; border-color: #d4d4d8; }
        .rg-btn-entendi { background: linear-gradient(135deg, #F40009 0%, #900005 100%); color: white; box-shadow: 0 10px 24px -8px rgba(244,0,9,0.55), inset 0 1px 0 rgba(255,255,255,0.2); position: relative; overflow: hidden; }
        .rg-btn-entendi::after { content: ""; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%); transform: translateX(-100%); transition: transform 0.6s ease; }
        .rg-btn-entendi:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -8px rgba(244,0,9,0.65), inset 0 1px 0 rgba(255,255,255,0.2); }
        .rg-btn-entendi:hover::after { transform: translateX(100%); }
        .rg-btn:active { transform: scale(0.97); }

        @keyframes rgFadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rgFadeUp   { from { opacity: 0; transform: translateY(8px); }  to { opacity: 1; transform: translateY(0); } }
        @keyframes rgZoomIn   { from { opacity: 0; transform: scale(0.92); }       to { opacity: 1; transform: scale(1); } }
        @keyframes rgThumbIn  { from { opacity: 0; transform: translateY(14px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
      </style>
    `;
  },

  _setupNavegacao(container, idxIni, onChange) {
    const dotsBtn = container.querySelectorAll("[data-dot]");
    let atual = idxIni;

    const ir = (k) => {
      k = ((k % this.slides.length) + this.slides.length) % this.slides.length;
      if (k === atual) return;
      atual = k;
      onChange(k);
      dotsBtn.forEach((d) => {
        const ativo = parseInt(d.dataset.dot, 10) === k;
        d.classList.toggle("rg-dot-ativo", ativo);
        const slide = this.slides[parseInt(d.dataset.dot, 10)];
        d.style.setProperty("--cor", slide.isNova ? "var(--rg-amber)" : "var(--rg-red)");
      });
    };

    dotsBtn.forEach((d) => d.addEventListener("click", () => ir(parseInt(d.dataset.dot, 10))));

    // Setas trio anterior/próximo (delegação — slide é re-renderizado)
    container.addEventListener("click", (e) => {
      if (e.target.closest("[data-trio-prev]")) ir(atual - 1);
      if (e.target.closest("[data-trio-next]")) ir(atual + 1);
    });

    let tx = 0;
    container.addEventListener("touchstart", (e) => { tx = e.changedTouches[0].screenX; }, { passive: true });
    container.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].screenX - tx;
      if (Math.abs(dx) > 60) ir(atual + (dx < 0 ? 1 : -1));
    }, { passive: true });

    const onKey = (e) => {
      if (e.key === "ArrowLeft") ir(atual - 1);
      if (e.key === "ArrowRight") ir(atual + 1);
    };
    document.addEventListener("keydown", onKey);
    const cleanup = setInterval(() => {
      if (!document.body.contains(container)) {
        document.removeEventListener("keydown", onKey);
        clearInterval(cleanup);
      }
    }, 500);

    return { ir };
  },

  // Cross-fade entre regras dentro do trio (via thumbs)
  _setupThumbs(container, idxTrio) {
    const slide = this.slides[idxTrio];
    const thumbs = container.querySelectorAll(".rg-thumb");
    const img = container.querySelector(`#rg-img-grande-${idxTrio}`);
    if (!img) return;
    thumbs.forEach((t) => {
      t.addEventListener("click", () => {
        const n = parseInt(t.dataset.thumb, 10);
        if (img.alt === `Regra ${n}`) return;
        img.classList.add("rg-trocando");
        setTimeout(() => {
          img.src = `./assets/img/regra${n}.png`;
          img.alt = `Regra ${n}`;
          img.classList.remove("rg-trocando");
        }, 200);
        thumbs.forEach((tt) => tt.classList.toggle("rg-thumb-ativo", tt === t));
      });
    });
  },

  // ---------- Splash ----------
  splash(callback) {
    if (this.foiVista() || !window.Swal) {
      if (callback) callback();
      return;
    }

    const isMobile = window.innerWidth < 640;
    const idxIni = 0;
    const dotsHtml = this._dotsHTML(idxIni);

    window.Swal.fire({
      html: `
        ${this._styles()}
        <div class="rg-root" style="position:relative;height:${isMobile ? "calc(100dvh - 28px)" : "min(85vh, 780px)"};">
          <div class="rg-shell">
            <div class="rg-header">
              <img src="./assets/img/titulo_regra.png" class="rg-title" alt="Regras de Ouro">
              <span class="rg-sub">Antes de continuar, conheça as 10 regras</span>
            </div>
            <div id="rg-stage-container" style="flex:1; min-height:0; display:flex;">
              ${this._slideHTML(this.slides[idxIni], idxIni)}
            </div>
            <div class="rg-footer">
              <div class="rg-dots">${dotsHtml}</div>
              <div class="rg-actions">
                <button data-pular class="rg-btn rg-btn-pular">Pular</button>
                <button data-entendi class="rg-btn rg-btn-entendi">
                  Entendi, vamos lá
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: false,
      allowOutsideClick: false,
      width: isMobile ? "100%" : "min(94vw, 760px)",
      heightAuto: false,
      padding: isMobile ? "0.6rem" : "1.25rem",
      background: "white",
      customClass: { popup: "swal2-popup-custom regras-splash-popup", container: "regras-splash-container" },
      didOpen: () => {
        const root = document.querySelector(".rg-root");
        const stage = root.querySelector("#rg-stage-container");
        const btnPular = root.querySelector("[data-pular]");
        const btnEntendi = root.querySelector("[data-entendi]");

        this._setupThumbs(root, idxIni);
        this._setupNavegacao(root, idxIni, (k) => {
          stage.style.opacity = "0";
          stage.style.transform = "translateX(20px)";
          stage.style.transition = "all 0.25s ease";
          setTimeout(() => {
            stage.innerHTML = this._slideHTML(this.slides[k], k);
            stage.style.opacity = "1";
            stage.style.transform = "translateX(0)";
            this._setupThumbs(root, k);
          }, 220);
        });

        const fechar = () => {
          this.marcarVista();
          window.Swal.close();
          if (callback) setTimeout(callback, 50);
        };
        btnPular.addEventListener("click", fechar);
        btnEntendi.addEventListener("click", fechar);
      },
    });
  },

  // ---------- Banner ----------
  renderBanner({ classe = "" } = {}) {
    return `
      <button onclick="(window.Regras||{}).abrirGaleria&&window.Regras.abrirGaleria()"
        class="${classe} w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-100 rounded-xl hover:border-[#F40009] hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 bg-[#F40009] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-700">Regras de Ouro · Toque para ler</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-[#F40009] group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
      </button>`;
  },

  // ---------- Galeria (rever) ----------
  abrirGaleria() {
    if (!window.Swal) return;
    const isMobile = window.innerWidth < 640;
    const idxIni = 0;
    const dotsHtml = this._dotsHTML(idxIni);

    window.Swal.fire({
      html: `
        ${this._styles()}
        <div class="rg-root" style="position:relative;height:${isMobile ? "calc(100dvh - 28px)" : "min(85vh, 780px)"};">
          <div class="rg-shell">
            <div class="rg-header">
              <img src="./assets/img/titulo_regra.png" class="rg-title" alt="Regras de Ouro">
            </div>
            <div id="rg-stage-container" style="flex:1; min-height:0; display:flex;">
              ${this._slideHTML(this.slides[idxIni], idxIni)}
            </div>
            <div class="rg-footer">
              <div class="rg-dots">${dotsHtml}</div>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: isMobile ? "100%" : "min(94vw, 760px)",
      heightAuto: false,
      padding: isMobile ? "0.6rem" : "1.25rem",
      background: "white",
      customClass: { popup: "swal2-popup-custom regras-splash-popup", container: "regras-splash-container" },
      didOpen: () => {
        const root = document.querySelector(".rg-root");
        const stage = root.querySelector("#rg-stage-container");

        this._setupThumbs(root, idxIni);
        this._setupNavegacao(root, idxIni, (k) => {
          stage.style.opacity = "0";
          stage.style.transform = "translateX(20px)";
          stage.style.transition = "all 0.25s ease";
          setTimeout(() => {
            stage.innerHTML = this._slideHTML(this.slides[k], k);
            stage.style.opacity = "1";
            stage.style.transform = "translateX(0)";
            this._setupThumbs(root, k);
          }, 220);
        });
      },
    });
  },

  abrirFullscreen() { return this.abrirGaleria(); },
};

if (typeof window !== "undefined") window.Regras = Regras;
