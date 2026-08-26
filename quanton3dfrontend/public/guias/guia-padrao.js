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

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ensurePrintButton();
        setupScrollSpy();
      },
      { once: true },
    );
  } else {
    ensurePrintButton();
    setupScrollSpy();
  }
})();
