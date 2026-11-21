(() => {
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const breit = window.matchMedia("(min-width: 960px)");
  const fein = window.matchMedia("(pointer: fine)").matches;
  const mobilNav = window.matchMedia("(max-width: 899px)");

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
    if (lenis) (offen && mobilNav.matches ? lenis.stop() : lenis.start());
  };

  if (nav && schalt && panel) {
    if (mobilNav.matches) panel.setAttribute("inert", "");
    schalt.addEventListener("click", () => menue(!nav.classList.contains("is-offen")));
    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => { if (mobilNav.matches) menue(false); });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-offen")) {
        menue(false);
        schalt.focus();
      }
    });
    mobilNav.addEventListener("change", () => menue(false));
  }

  const navLinks = panel ? [...panel.querySelectorAll('a[href^="#"]')] : [];
  const abschnitte = [...document.querySelectorAll("main section[id]")];
  if (navLinks.length && abschnitte.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((eintrag) => {
        if (!eintrag.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.getAttribute("href").slice(1) === eintrag.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 });
    abschnitte.forEach((el) => io.observe(el));
  }

  const hero = document.querySelector(".hero");
  const spot = document.querySelector(".hero__spot");
  if (hero && spot && fein && !reduziert) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      spot.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      spot.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  }

  const flaeche = document.querySelector("[data-rolle='flaeche']");
  if (flaeche instanceof HTMLCanvasElement) {
    const ctx = flaeche.getContext("2d");
    if (ctx) {
      const N = 18;
      let w = 0;
      let h = 0;
      let rotX = -0.62;
      let rotY = 0.55;
      let zielX = rotX;
      let zielY = rotY;
      let lauf = true;
      let letzter = 0;
      let rahmen = 0;

      const fn = (x, y) => Math.sin(x) * Math.cos(y);

      const groesse = () => {
        const rect = flaeche.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        w = rect.width;
        h = rect.height;
        flaeche.width = Math.max(1, Math.floor(w * dpr));
        flaeche.height = Math.max(1, Math.floor(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const projekt = (x, y, z) => {
        const cy = Math.cos(rotY);
        const sy = Math.sin(rotY);
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const cx = Math.cos(rotX);
        const sx = Math.sin(rotX);
        const y1 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        const persp = 5 / (5 + z2);
        const s = Math.min(w, h) * 0.16;
        return [w * 0.5 + x1 * persp * s, h * 0.56 - y1 * persp * s];
      };

      const zeichne = () => {
        ctx.clearRect(0, 0, w, h);
        const punkte = [];
        for (let j = 0; j <= N; j += 1) {
          const reihe = [];
          for (let i = 0; i <= N; i += 1) {
            const x = -2.4 + (4.8 * i) / N;
            const y = -2.4 + (4.8 * j) / N;
            const z = fn(x, y);
            reihe.push([...projekt(x, z, y), z]);
          }
          punkte.push(reihe);
        }
        const linie = (a, b) => {
          const z = (a[2] + b[2]) * 0.5;
          ctx.strokeStyle = z > 0.35 ? "rgba(214,255,74,0.95)" : "rgba(12,13,16,0.55)";
          ctx.lineWidth = z > 0.35 ? 1.35 : 1;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        };
        for (let j = 0; j <= N; j += 1) {
          for (let i = 0; i <= N; i += 1) {
            if (i < N) linie(punkte[j][i], punkte[j][i + 1]);
            if (j < N) linie(punkte[j][i], punkte[j + 1][i]);
          }
        }
      };

      const wrap = flaeche.parentElement;
      if (wrap && fein && !reduziert) {
        wrap.addEventListener("pointermove", (event) => {
          const rect = wrap.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          zielY = 0.55 + nx * 0.8;
          zielX = -0.62 + ny * 0.45;
        });
      }

      groesse();
      zeichne();
      const tick = (zeit) => {
        if (!lauf) return;
        const dt = Math.min(0.05, (zeit - letzter) / 1000 || 0.016);
        letzter = zeit;
        if (!reduziert) {
          zielY += dt * 0.15;
          rotX += (zielX - rotX) * 0.08;
          rotY += (zielY - rotY) * 0.08;
          zeichne();
          rahmen = window.requestAnimationFrame(tick);
        }
      };
      const io = new IntersectionObserver((entries) => {
        lauf = entries[0].isIntersecting && !document.hidden;
        if (lauf && !reduziert) {
          letzter = 0;
          rahmen = window.requestAnimationFrame(tick);
        } else window.cancelAnimationFrame(rahmen);
      });
      io.observe(flaeche);
      window.addEventListener("resize", () => { groesse(); zeichne(); }, { passive: true });
      if (!reduziert) rahmen = window.requestAnimationFrame(tick);
    }
  }

  if (fein && !reduziert) {
    document.querySelectorAll("[data-magnet]").forEach((knopf) => {
      knopf.addEventListener("pointermove", (event) => {
        const rect = knopf.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) * 0.28;
        const y = (event.clientY - (rect.top + rect.height / 2)) * 0.4;
        knopf.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      knopf.addEventListener("pointerleave", () => { knopf.style.transform = ""; });
    });
  }

  const kurve = (art) => {
    const teile = [];
    if (art === "para") {
      for (let i = 0; i <= 100; i += 1) {
        const x = -3 + (6 * i) / 100;
        const px = 80 + ((x + 3) / 6) * 640;
        const py = 450 - ((x * x) / 9) * 340;
        teile.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    } else {
      for (let i = 0; i <= 160; i += 1) {
        const t = i / 160;
        const x = t * Math.PI * 4;
        const px = 80 + t * 640;
        const py = 260 - Math.sin(x) * 150;
        teile.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    }
    return teile.join(" ");
  };
  document.querySelectorAll("[data-fn]").forEach((pfad) => {
    pfad.setAttribute("d", kurve(pfad.getAttribute("data-fn")));
  });

  const zaehler = [...document.querySelectorAll("[data-zaehler]")];
  if (zaehler.length && "IntersectionObserver" in window) {
    const start = (el) => {
      const ziel = Number(el.dataset.zaehler);
      if (!Number.isFinite(ziel)) return;
      if (reduziert) {
        el.textContent = String(ziel);
        return;
      }
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 800);
        const e = 1 - (1 - p) ** 3;
        el.textContent = String(Math.round(ziel * e));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = String(ziel);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((eintrag) => {
        if (!eintrag.isIntersecting) return;
        start(eintrag.target);
        io.unobserve(eintrag.target);
      });
    }, { threshold: 0.6 });
    zaehler.forEach((el) => io.observe(el));
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
        lenis.scrollTo(ziel, { offset: -72 });
      });
    });
  }

  gsap.from(".hero__text > *, .hero__actions > *", { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.06, ease: "power2.out" });
  gsap.to(".formeln li", {
    y: (index) => 30 + index * 12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  const grafik = document.querySelector("[data-grafiken]");
  const panels = [...document.querySelectorAll("[data-panel]")];
  if (grafik && panels.length && breit.matches) {
    grafik.classList.add("ist-pin");
    panels.forEach((item, index) => {
      item.classList.toggle("ist-aktiv", index === 0);
      item.style.setProperty("--draw", "0");
    });
    window.ScrollTrigger.create({
      trigger: grafik,
      start: "top 68px",
      end: () => `+=${window.innerHeight * 2.5}`,
      pin: true,
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const n = panels.length;
        const idx = Math.min(n - 1, Math.floor(self.progress * n * 0.999));
        panels.forEach((item, index) => {
          const local = Math.min(1, Math.max(0, self.progress * n - index));
          item.style.setProperty("--draw", index < idx ? "1" : index === idx ? local.toFixed(3) : "0");
          item.classList.toggle("ist-aktiv", index === idx);
        });
      },
    });
  } else {
    panels.forEach((item) => {
      item.style.setProperty("--draw", "0");
      window.ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        end: "center 45%",
        scrub: true,
        onUpdate(self) { item.style.setProperty("--draw", self.progress.toFixed(3)); },
      });
    });
  }

  const stimmen = document.querySelector("[data-stimmen]");
  const schiene = document.querySelector("[data-schiene]");
  if (stimmen && schiene && breit.matches) {
    stimmen.classList.add("ist-horizontal");
    gsap.to(schiene, {
      x: () => -(schiene.scrollWidth - window.innerWidth + 48),
      ease: "none",
      scrollTrigger: {
        trigger: stimmen,
        start: "top 68px",
        end: () => `+=${Math.max(schiene.scrollWidth - window.innerWidth + 180, window.innerHeight)}`,
        pin: true,
        scrub: 0.75,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }
})();
