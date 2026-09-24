(() => {
  const label = "Imprimir / Salvar PDF";

  function ensurePrintButton() {
    const existing = [...document.querySelectorAll("button")]
      .find((button) => /imprimir\s*\/\s*salvar\s*pdf/i.test(button.textContent || ""));

    if (existing) {
      existing.classList.add("guide-print-button");
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "guide-print-button";
    button.textContent = label;
    button.addEventListener("click", () => window.print());

    const legacyNav = document.querySelector("nav.guidenav");
    if (legacyNav) {
      legacyNav.append(button);
      return;
    }

    const modernNav = document.querySelector("nav.nav .navin");
    if (modernNav) {
      modernNav.append(button);
      return;
    }

    const utility = document.createElement("div");
    utility.className = "guide-utility-bar";
    utility.append(button);
    document.body.prepend(utility);
  }

  function setupScrollSpy() {
    const submenu = document.querySelector("nav.nav, nav.guidenav, .toc");
    if (!submenu) return;

    const entries = [...submenu.querySelectorAll('a[href^="#"]')]
      .map((link) => {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const section = document.getElementById(id);
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!entries.length) return;

    let activeId = null;
    let scheduled = false;

    const activate = (id) => {
      if (id === activeId) return;
      activeId = id;
      entries.forEach(({ link, section }) => {
        link.classList.toggle("is-active", section.id === id);
        link.toggleAttribute("aria-current", section.id === id);
      });
    };

    const updateActiveSection = () => {
      scheduled = false;
      const readingLine = Math.min(window.innerHeight * 0.35, 300);
      let current = entries[0];

      for (const entry of entries) {
        const bounds = entry.section.getBoundingClientRect();
        // Alguns guias usam âncoras internas, sem altura própria. A posição
        // vertical basta para identificar a última seção já alcançada.
        if (bounds.top <= readingLine) {
          current = entry;
        }
      }

      activate(current.section.id);
    };

    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
    requestUpdate();
  }

  function setupAutoHideNav() {
    const submenu = document.querySelector("nav.nav, nav.guidenav, .guide-utility-bar");
    if (!submenu) return;

    const hiddenClass = "is-guide-nav-hidden";
    let lastPosition = Math.max(window.scrollY, 0);
    let scheduled = false;

    const show = () => submenu.classList.remove(hiddenClass);

    const update = () => {
      scheduled = false;
      const currentPosition = Math.max(window.scrollY, 0);

      if (currentPosition <= 24 || submenu.contains(document.activeElement)) {
        show();
        lastPosition = currentPosition;
        return;
      }

      const delta = currentPosition - lastPosition;
      if (Math.abs(delta) < 8) return;

      submenu.classList.toggle(hiddenClass, delta > 0);
      lastPosition = currentPosition;
    };

    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    submenu.addEventListener("focusin", show);
    submenu.addEventListener("click", show);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("hashchange", show);
    window.addEventListener("pageshow", show);
    show();
  }


  // Imagens dos guias: identifica o guia (para ajustes especificos no CSS),
  // mostra a figura inteira quando ela estava cortada em faixa fina e
  // permite ampliar qualquer imagem com um clique.
  function setupImagens() {
    const nome = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "");
    if (nome) document.documentElement.dataset.guia = nome;

    const ehConteudo = (img) =>
      !img.closest("nav, .nav, .guidenav, .guide-utility-bar, header .brand, .logo") &&
      !img.classList.contains("no-zoom");

    const ajustar = (img) => {
      if (!ehConteudo(img) || !img.naturalWidth || !img.naturalHeight) return;
      const box = img.getBoundingClientRect();
      if (box.width < 60 || box.height < 30) return;
      const cs = getComputedStyle(img);
      const heroi = img.closest("header, .hero, .heroVisual, .photoHero") || box.height >= 300;
      // Recortes pequenos de um infografico maior: mostrar inteiro revelaria texto cortado
      const recortePequeno = Math.max(img.naturalWidth, img.naturalHeight) < 200;
      if (cs.objectFit === "cover" && !heroi && !recortePequeno) {
        const proporcaoImg = img.naturalWidth / img.naturalHeight;
        const proporcaoCaixa = box.width / box.height;
        const corte = Math.max(proporcaoImg / proporcaoCaixa, proporcaoCaixa / proporcaoImg);
        // Cortava mais de ~25% da figura: mostra inteira, sem esticar alem de 2x o original
        if (corte > 1.33) {
          const alturaIdeal = box.width / proporcaoImg;
          const altura = Math.round(Math.max(box.height, Math.min(alturaIdeal, img.naturalHeight * 2, 420)));
          img.classList.add("guia-img-inteira");
          img.style.setProperty("height", altura + "px", "important");
          img.style.setProperty("object-fit", "contain", "important");
        }
      }
      img.classList.add("guia-img-zoom");
      if (!img.hasAttribute("tabindex")) img.tabIndex = 0;
      if (!img.getAttribute("title")) img.title = "Clique para ampliar";
    };

    // Guias cujas fotos tem a peca pequena num fundo escuro grande: aproxima a imagem
    const RECORTES = {
      "guia-tensao-termica": [
        { seletor: '.visualCard > img:not([src^="images/"])', zoom: 4.5 },
        { seletor: ".heroVisual > img", zoom: 2.2 },
      ],
    };
    (RECORTES[nome] || []).forEach(({ seletor, zoom }) => {
      document.querySelectorAll(seletor).forEach((img) => {
        if (img.parentElement.classList.contains("guia-img-recorte")) return;
        const moldura = document.createElement("span");
        moldura.className = "guia-img-recorte";
        moldura.style.setProperty("--guia-zoom", String(zoom));
        img.dataset.guiaZoom = String(zoom);
        img.replaceWith(moldura);
        moldura.append(img);
      });
    });

    const imagens = [...document.images].filter(ehConteudo);
    imagens.forEach((img) => {
      if (img.complete) ajustar(img);
      else img.addEventListener("load", () => ajustar(img), { once: true });
    });

    // Imagens com carregamento tardio (lazy) so tem tamanho depois de entrar na tela
    window.addEventListener("load", () => imagens.forEach(ajustar), { once: true });

    let overlay = null;
    const fechar = () => {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      document.documentElement.classList.remove("guia-zoom-aberto");
    };
    const abrir = (img) => {
      fechar();
      overlay = document.createElement("div");
      overlay.className = "guia-zoom";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-label", "Imagem ampliada");
      const grande = document.createElement("img");
      grande.src = img.currentSrc || img.src;
      grande.alt = img.alt || "";
      const legenda = document.createElement("p");
      const fig = img.closest("figure");
      legenda.textContent = (fig && fig.querySelector("figcaption")?.textContent.trim()) || img.alt || "";
      const botao = document.createElement("button");
      botao.type = "button";
      botao.textContent = "Fechar ✕";
      if (img.dataset.guiaZoom) {
        // Foto com a peca pequena: a ampliacao mostra o mesmo recorte aproximado
        const moldura = document.createElement("span");
        moldura.className = "guia-img-recorte guia-zoom-recorte";
        moldura.style.setProperty("--guia-zoom", img.dataset.guiaZoom);
        moldura.append(grande);
        overlay.append(botao, moldura);
      } else {
        overlay.append(botao, grande);
      }
      if (legenda.textContent) overlay.append(legenda);
      overlay.addEventListener("click", fechar);
      document.body.append(overlay);
      document.documentElement.classList.add("guia-zoom-aberto");
      botao.focus();
    };

    document.addEventListener("click", (e) => {
      const img = e.target.closest && e.target.closest("img.guia-img-zoom");
      if (!img || (overlay && overlay.contains(img))) return;
      if (img.closest("a")) return;
      e.preventDefault();
      abrir(img);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fechar();
      if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("guia-img-zoom")) {
        e.preventDefault();
        abrir(e.target);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ensurePrintButton();
        setupScrollSpy();
        setupAutoHideNav();
        setupImagens();
      },
      { once: true },
    );
  } else {
    ensurePrintButton();
    setupScrollSpy();
    setupAutoHideNav();
    setupImagens();
  }
})();
