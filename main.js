(() => {
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const breit = window.matchMedia("(min-width: 960px)");
  const mobilNav = window.matchMedia("(max-width: 959px)");

  const nav = document.querySelector("[data-nav]");
  const schalt = document.querySelector("[data-nav-schalt]");
  const panel = document.querySelector("[data-nav-panel]");
  let lenis = null;

  const menue = (offen) => {
    if (!nav || !schalt || !panel) return;
    nav.classList.toggle("is-offen", offen);
    schalt.setAttribute("aria-expanded", String(offen));
    schalt.setAttribute("aria-label", offen ? "Menü schließen" : "Menü öffnen");
    document.body.classList.toggle("ist-gesperrt", offen && mobilNav.matches);
    if (mobilNav.matches && !offen) panel.setAttribute("inert", "");
    else panel.removeAttribute("inert");
    if (lenis) {
      if (offen && mobilNav.matches) lenis.stop();
      else lenis.start();
    }
  };

  if (nav && schalt && panel) {
    nav.classList.add("js-nav");
    if (mobilNav.matches) panel.setAttribute("inert", "");
    schalt.addEventListener("click", () => menue(!nav.classList.contains("is-offen")));
    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobilNav.matches) menue(false);
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-offen")) {
        menue(false);
        schalt.focus();
      }
    });
    mobilNav.addEventListener("change", () => menue(false));
  }

  const abschnitte = [...document.querySelectorAll("main section[id]")];
  const navLinks = panel ? [...panel.querySelectorAll('a[href^="#"]')] : [];
  if (abschnitte.length && navLinks.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (eintraege) => {
        eintraege.forEach((eintrag) => {
          if (!eintrag.isIntersecting) return;
          navLinks.forEach((link) => {
            const ziel = link.getAttribute("href").slice(1);
            if (ziel === eintrag.target.id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
    );
    abschnitte.forEach((el) => io.observe(el));
  }

  const flaeche = document.querySelector("[data-rolle='formeln']");
  if (flaeche instanceof HTMLCanvasElement) {
    const ctx = flaeche.getContext("2d");
    if (ctx) {
      const texte = ["y = ax^2 + bx + c", "F = m · a", "sin(x)", "a^2 + b^2 = c^2", "v = s / t", "dx / dt", "E = mc^2"];
      let breite = 0;
      let hoehe = 0;
      let teile = [];
      let laeuft = true;
      let letzter = 0;
      let rahmen = 0;

      const groesse = () => {
        const rect = flaeche.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        breite = rect.width;
        hoehe = rect.height;
        flaeche.width = Math.max(1, Math.floor(breite * dpr));
        flaeche.height = Math.max(1, Math.floor(hoehe * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const seeden = () => {
        teile = [];
        const schmal = breite < 760;
        const n = schmal ? 6 : 11;
        for (let i = 0; i < n; i += 1) {
          teile.push({
            art: i % 3 === 0 ? "text" : i % 3 === 1 ? "welle" : "kreis",
            text: texte[i % texte.length],
            x: Math.random() * breite,
            y: Math.random() * hoehe,
            vx: (Math.random() - 0.5) * 14,
            vy: -8 - Math.random() * 16,
            rot: (Math.random() - 0.5) * 0.4,
            vr: (Math.random() - 0.5) * 0.12,
            groesse: 16 + Math.random() * 18,
            r: 18 + Math.random() * 36,
            alpha: 0.16 + Math.random() * 0.22,
            koralle: Math.random() > 0.55,
          });
        }
      };

      const zeichne = () => {
        ctx.clearRect(0, 0, breite, hoehe);
        teile.forEach((teil) => {
          ctx.save();
          ctx.translate(teil.x, teil.y);
          ctx.rotate(teil.rot || 0);
          ctx.globalAlpha = teil.alpha;
          ctx.strokeStyle = teil.koralle ? "#FF4D3A" : "#1C1848";
          ctx.fillStyle = ctx.strokeStyle;
          ctx.lineWidth = 1.4;
          if (teil.art === "text") {
            ctx.font = `700 ${teil.groesse}px "Bricolage Grotesque", sans-serif`;
            ctx.fillText(teil.text, 0, 0);
          } else if (teil.art === "kreis") {
            ctx.beginPath();
            ctx.arc(0, 0, teil.r, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            for (let x = -60; x <= 60; x += 4) {
              const y = Math.sin(x / 14) * 16;
              if (x === -60) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          ctx.restore();
        });
      };

      const schritt = (zeit) => {
        if (!laeuft) return;
        const dt = Math.min(0.05, (zeit - letzter) / 1000 || 0.016);
        letzter = zeit;
        if (!reduziert) {
          teile.forEach((teil) => {
            teil.x += teil.vx * dt;
            teil.y += teil.vy * dt;
            teil.rot += (teil.vr || 0) * dt;
            if (teil.y < -80) teil.y = hoehe + 40;
            if (teil.x < -160) teil.x = breite + 40;
            if (teil.x > breite + 160) teil.x = -40;
          });
        }
        zeichne();
        if (!reduziert) rahmen = window.requestAnimationFrame(schritt);
      };

      groesse();
      seeden();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(zeichne).catch(() => {});
      zeichne();
      const io = new IntersectionObserver((entries) => {
        laeuft = entries[0].isIntersecting && !document.hidden;
        if (laeuft && !reduziert) {
          letzter = 0;
          rahmen = window.requestAnimationFrame(schritt);
        } else window.cancelAnimationFrame(rahmen);
      });
      io.observe(flaeche);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) window.cancelAnimationFrame(rahmen);
        else if (laeuft && !reduziert) rahmen = window.requestAnimationFrame(schritt);
      });
      window.addEventListener("resize", () => { groesse(); seeden(); zeichne(); }, { passive: true });
      if (!reduziert) rahmen = window.requestAnimationFrame(schritt);
    }
  }

  if (reduziert || !window.gsap || !window.ScrollTrigger) return;
  document.documentElement.classList.add("mit-motion");

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", window.ScrollTrigger.update);
    gsap.ticker.add((zeit) => lenis.raf(zeit * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        const ziel = document.querySelector(id);
        if (!ziel) return;
        event.preventDefault();
        if (mobilNav.matches) menue(false);
        lenis.scrollTo(ziel, { offset: -80 });
      });
    });
  }

  const panels = [...document.querySelectorAll("[data-skizze]")];
  const buehne = document.querySelector("[data-buehne]");
  if (panels.length && breit.matches && buehne) {
    buehne.classList.add("ist-pin");
    panels.forEach((panel, i) => {
      panel.classList.toggle("ist-aktiv", i === 0);
      panel.style.setProperty("--draw", "0");
    });
    window.ScrollTrigger.create({
      trigger: buehne,
      start: "top 72px",
      end: () => `+=${window.innerHeight * 2.6}`,
      pin: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const n = panels.length;
        const idx = Math.min(n - 1, Math.floor(self.progress * n));
        panels.forEach((panel, i) => {
          const start = i / n;
          const local = Math.min(1, Math.max(0, (self.progress - start) * n));
          panel.style.setProperty("--draw", i < idx ? "1" : i === idx ? local.toFixed(3) : "0");
          panel.classList.toggle("ist-aktiv", i === idx);
        });
      },
    });
  } else {
    panels.forEach((panel) => {
      window.ScrollTrigger.create({
        trigger: panel,
        start: "top 85%",
        end: "bottom 45%",
        scrub: true,
        onUpdate(self) {
          panel.style.setProperty("--draw", self.progress.toFixed(3));
        },
      });
    });
  }

  const stimmen = document.querySelector("[data-stimmen]");
  const schiene = document.querySelector("[data-schiene]");
  if (stimmen && schiene && breit.matches) {
    stimmen.classList.add("ist-horizontal");
    gsap.to(schiene, {
      x: () => -(schiene.scrollWidth - window.innerWidth + 64),
      ease: "none",
      scrollTrigger: {
        trigger: stimmen,
        start: "top 72px",
        end: () => `+=${Math.max(schiene.scrollWidth - window.innerWidth + 200, window.innerHeight)}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  } else if (stimmen) {
    gsap.utils.toArray(".zettel").forEach((el, index) => {
      gsap.fromTo(el, { y: 28, rotate: index % 2 ? 1.4 : -1.4 }, {
        y: 0,
        rotate: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 92%", end: "top 58%", scrub: true },
      });
    });
  }

  gsap.from(".hero__text > *", {
    y: 18,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: "power2.out",
  });
})();
