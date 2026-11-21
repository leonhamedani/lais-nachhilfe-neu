/* Bewegung nur ohne prefers-reduced-motion. Inhalte bleiben ohne Skript lesbar. */
(() => {
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fein = window.matchMedia("(pointer: fine)").matches;
  const mobilNav = window.matchMedia("(max-width: 1079px)");

  const video = document.querySelector('[data-rolle="hero"]');
  const pauseKnopf = document.querySelector('[data-rolle="video-pause"]');

  const setzePause = (angehalten) => {
    if (!pauseKnopf) return;
    pauseKnopf.setAttribute("aria-pressed", String(angehalten));
    pauseKnopf.setAttribute(
      "aria-label",
      angehalten ? "Hintergrundvideo abspielen" : "Hintergrundvideo anhalten"
    );
  };

  if (video && pauseKnopf) {
    const abspielen = () => {
      const versuch = video.play();
      if (versuch && typeof versuch.catch === "function") {
        versuch.catch(() => setzePause(true));
      }
    };

    video.addEventListener("play", () => setzePause(false));
    video.addEventListener("pause", () => setzePause(true));

    if (reduziert) {
      video.pause();
      if (video.played && video.played.length > 0) video.load();
      setzePause(true);
    } else {
      setzePause(video.paused);
      abspielen();
    }

    pauseKnopf.addEventListener("click", () => {
      if (video.paused) abspielen();
      else video.pause();
    });
  }

  /* Navigation -------------------------------------------------------- */
  const nav = document.querySelector("[data-nav]");
  const schalt = document.querySelector("[data-nav-schalt]");
  const panel = document.querySelector("[data-nav-panel]");
  let lenis = null;

  const menueOffen = () => nav && nav.classList.contains("is-offen");

  const menue = (offen) => {
    if (!nav || !schalt || !panel) return;
    nav.classList.toggle("is-offen", offen);
    schalt.setAttribute("aria-expanded", String(offen));
    schalt.setAttribute("aria-label", offen ? "Menü schließen" : "Menü öffnen");
    document.body.classList.toggle("ist-gesperrt", offen && mobilNav.matches);
    if (offen && mobilNav.matches) {
      panel.removeAttribute("inert");
      if (lenis) lenis.stop();
    } else if (mobilNav.matches) {
      panel.setAttribute("inert", "");
      if (lenis) lenis.start();
    } else {
      panel.removeAttribute("inert");
      document.body.classList.remove("ist-gesperrt");
    }
  };

  if (nav && schalt && panel) {
    nav.classList.add("js-nav");
    if (mobilNav.matches) panel.setAttribute("inert", "");
    schalt.addEventListener("click", () => menue(!menueOffen()));
    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobilNav.matches) menue(false);
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menueOffen()) {
        menue(false);
        schalt.focus();
      }
      if (event.key !== "Tab" || !menueOffen() || !mobilNav.matches) return;
      const knoten = [schalt, ...panel.querySelectorAll("a")];
      const erstes = knoten[0];
      const letztes = knoten[knoten.length - 1];
      if (event.shiftKey && document.activeElement === erstes) {
        event.preventDefault();
        letztes.focus();
      } else if (!event.shiftKey && document.activeElement === letztes) {
        event.preventDefault();
        erstes.focus();
      }
    });
    mobilNav.addEventListener("change", () => menue(false));
  }

  const abschnitte = [...document.querySelectorAll("main section[id]")];
  const navLinks = panel ? [...panel.querySelectorAll('a[href^="#"]')] : [];
  if (abschnitte.length && navLinks.length && "IntersectionObserver" in window) {
    const sicht = new Map();
    const beobachteNav = new IntersectionObserver(
      (eintraege) => {
        eintraege.forEach((eintrag) => {
          sicht.set(eintrag.target.id, eintrag.isIntersecting ? eintrag.intersectionRatio : 0);
        });
        let aktiv = "";
        let best = 0;
        sicht.forEach((wert, id) => {
          if (wert > best) {
            best = wert;
            aktiv = id;
          }
        });
        navLinks.forEach((link) => {
          const ziel = link.getAttribute("href").slice(1);
          if (ziel === aktiv) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    abschnitte.forEach((abschnitt) => beobachteNav.observe(abschnitt));
  }

  /* Formel-Feld über dem Hero-Video ----------------------------------- */
  const flaeche = document.querySelector("[data-rolle='formeln']");
  if (flaeche instanceof HTMLCanvasElement) {
    const kontext = flaeche.getContext("2d");
    if (kontext) {
      const texte = [
        "y = ax^2 + bx + c",
        "F = m · a",
        "E = mc^2",
        "a^2 + b^2 = c^2",
        "sin(x)",
        "v = s / t",
        "dx / dt",
        "A = π r^2",
      ];
      let breite = 0;
      let hoehe = 0;
      let teile = [];
      let zeigerX = 0;
      let zeigerY = 0;
      let laeuft = true;
      let letzter = 0;
      let rahmen = 0;

      const groesse = () => {
        const rect = flaeche.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        breite = rect.width;
        hoehe = rect.height;
        flaeche.width = Math.max(1, Math.floor(breite * dpr));
        flaeche.height = Math.max(1, Math.floor(hoehe * dpr));
        kontext.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const seeden = () => {
        teile = [];
        const schmal = breite < 760;
        const nText = schmal ? 5 : 8;
        const nPunkt = schmal ? 16 : 36;
        for (let i = 0; i < nText; i += 1) {
          teile.push({
            art: "text",
            text: texte[i % texte.length],
            x: Math.random() * breite,
            y: Math.random() * hoehe,
            vx: (Math.random() - 0.5) * 10,
            vy: -6 - Math.random() * 12,
            rot: (Math.random() - 0.5) * 0.5,
            vr: (Math.random() - 0.5) * 0.08,
            groesse: 15 + Math.random() * 16,
            alpha: 0.16 + Math.random() * 0.22,
            gold: Math.random() > 0.62,
            tiefe: 0.4 + Math.random() * 1,
          });
        }
        for (let i = 0; i < nPunkt; i += 1) {
          teile.push({
            art: "punkt",
            x: Math.random() * breite,
            y: Math.random() * hoehe,
            vx: (Math.random() - 0.5) * 8,
            vy: -4 - Math.random() * 14,
            r: 1 + Math.random() * 2.2,
            alpha: 0.15 + Math.random() * 0.4,
            gold: Math.random() > 0.5,
            tiefe: 0.3 + Math.random(),
          });
        }
        const formen = schmal ? 3 : 6;
        for (let i = 0; i < formen; i += 1) {
          teile.push({
            art: i % 2 === 0 ? "kreis" : "welle",
            x: Math.random() * breite,
            y: Math.random() * hoehe,
            vx: (Math.random() - 0.5) * 12,
            vy: -5 - Math.random() * 10,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.15,
            r: 16 + Math.random() * 28,
            alpha: 0.18 + Math.random() * 0.2,
            tiefe: 0.5 + Math.random(),
          });
        }
      };

      const zeichne = () => {
        kontext.clearRect(0, 0, breite, hoehe);
        const ox = reduziert ? 0 : zeigerX * 16;
        const oy = reduziert ? 0 : zeigerY * 10;
        teile.forEach((teil) => {
          kontext.save();
          kontext.translate(teil.x + ox * teil.tiefe, teil.y + oy * teil.tiefe);
          kontext.rotate(teil.rot || 0);
          kontext.globalAlpha = teil.alpha;
          kontext.strokeStyle = teil.gold ? "#E8B22A" : "#F6F3EA";
          kontext.fillStyle = kontext.strokeStyle;
          kontext.lineWidth = 1.25;
          if (teil.art === "text") {
            kontext.font = `italic ${teil.groesse}px Fraunces, Georgia, serif`;
            kontext.fillText(teil.text, 0, 0);
          } else if (teil.art === "punkt") {
            kontext.beginPath();
            kontext.arc(0, 0, teil.r, 0, Math.PI * 2);
            kontext.fill();
          } else if (teil.art === "kreis") {
            kontext.beginPath();
            kontext.arc(0, 0, teil.r, 0, Math.PI * 2);
            kontext.stroke();
          } else {
            kontext.beginPath();
            for (let x = -54; x <= 54; x += 3) {
              const y = Math.sin(x / 12) * 12;
              if (x === -54) kontext.moveTo(x, y);
              else kontext.lineTo(x, y);
            }
            kontext.stroke();
          }
          kontext.restore();
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
            teil.rot = (teil.rot || 0) + (teil.vr || 0) * dt;
            if (teil.y < -50) teil.y = hoehe + 30;
            if (teil.x < -120) teil.x = breite + 40;
            if (teil.x > breite + 120) teil.x = -40;
          });
        }
        zeichne();
        if (!reduziert) rahmen = window.requestAnimationFrame(schritt);
      };

      const hero = flaeche.closest(".hero");
      if (hero && fein && !reduziert) {
        hero.addEventListener("pointermove", (event) => {
          const rect = hero.getBoundingClientRect();
          zeigerX = (event.clientX - rect.left) / rect.width - 0.5;
          zeigerY = (event.clientY - rect.top) / rect.height - 0.5;
        });
      }

      groesse();
      seeden();
      zeichne();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(zeichne).catch(() => {});
      }

      const sichtbar = () => laeuft && !document.hidden;
      const starte = () => {
        if (!reduziert && sichtbar()) {
          letzter = 0;
          rahmen = window.requestAnimationFrame(schritt);
        } else {
          zeichne();
        }
      };
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((eintraege) => {
          laeuft = eintraege[0].isIntersecting;
          if (laeuft) starte();
          else window.cancelAnimationFrame(rahmen);
        });
        io.observe(flaeche);
      }
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) window.cancelAnimationFrame(rahmen);
        else starte();
      });
      window.addEventListener(
        "resize",
        () => {
          groesse();
          seeden();
          zeichne();
        },
        { passive: true }
      );
      if (!reduziert) starte();
    }
  }

  /* Karten neigen sich nur bei feinem Zeiger --------------------------- */
  if (fein && !reduziert) {
    document.querySelectorAll("[data-neigen]").forEach((karte) => {
      karte.addEventListener("pointermove", (event) => {
        const rect = karte.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        karte.style.transition = "transform 0.08s linear";
        karte.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`;
      });
      karte.addEventListener("pointerleave", () => {
        karte.style.transition = "transform 0.45s ease";
        karte.style.transform = "";
      });
    });
  }

  /* Zähler nur für Zahlen, die schon im Text stehen -------------------- */
  const zaehler = [...document.querySelectorAll("[data-zaehler]")];
  const formatiere = (wert, dezimal) => wert.toFixed(dezimal).replace(".", ",");
  const zaehle = (el) => {
    const ziel = Number(el.dataset.zaehler);
    const dezimal = Number(el.dataset.dezimal || 0);
    if (!Number.isFinite(ziel)) return;
    if (reduziert) {
      el.textContent = formatiere(ziel, dezimal);
      return;
    }
    const start = performance.now();
    const dauer = 900;
    const tick = (jetzt) => {
      const p = Math.min(1, (jetzt - start) / dauer);
      const kurve = 1 - (1 - p) ** 3;
      el.textContent = formatiere(ziel * kurve, dezimal);
      if (p < 1) window.requestAnimationFrame(tick);
      else el.textContent = formatiere(ziel, dezimal);
    };
    window.requestAnimationFrame(tick);
  };
  if (zaehler.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (eintraege) => {
        eintraege.forEach((eintrag) => {
          if (!eintrag.isIntersecting) return;
          zaehle(eintrag.target);
          io.unobserve(eintrag.target);
        });
      },
      { threshold: 0.6 }
    );
    zaehler.forEach((el) => io.observe(el));
  }

  /* Sanftes Erscheinen ------------------------------------------------- */
  const enthuellungen = [...document.querySelectorAll("[data-reveal]")];
  if (!reduziert && enthuellungen.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("mit-motion");
    const io = new IntersectionObserver(
      (eintraege) => {
        eintraege.forEach((eintrag) => {
          if (!eintrag.isIntersecting) return;
          eintrag.target.classList.add("ist-da");
          io.unobserve(eintrag.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    enthuellungen.forEach((el, index) => {
      el.style.setProperty("--verzug", `${(index % 4) * 0.06}s`);
      io.observe(el);
    });
    window.setTimeout(() => {
      enthuellungen.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) el.classList.add("ist-da");
      });
    }, 1600);
  }

  if (reduziert || !window.gsap) return;

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  if (window.Lenis && window.ScrollTrigger) {
    lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.05,
    });
    lenis.on("scroll", window.ScrollTrigger.update);
    gsap.ticker.add((zeit) => {
      lenis.raf(zeit * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        let ziel = null;
        try {
          ziel = document.querySelector(id);
        } catch (fehler) {
          ziel = null;
        }
        if (!ziel) return;
        event.preventDefault();
        if (mobilNav.matches) menue(false);
        lenis.scrollTo(ziel, { offset: -84 });
      });
    });
  }

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".hero__inhalt > *", {
      y: 26,
      autoAlpha: 0,
      duration: 0.85,
      stagger: 0.08,
      ease: "power2.out",
      delay: 0.05,
    });

    const heroVideo = document.querySelector(".hero__video");
    if (heroVideo && window.ScrollTrigger) {
      gsap.fromTo(
        heroVideo,
        { yPercent: -4, scale: 1.12 },
        {
          yPercent: 8,
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    if (window.ScrollTrigger) {
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const strecke = Number(el.dataset.parallax) || 24;
        gsap.to(el, {
          y: strecke,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }
  });
})();
