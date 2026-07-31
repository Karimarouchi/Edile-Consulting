/**
 * Edile Consulting — interactions
 */

(() => {
  const header = document.getElementById("main-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const langButtons = document.querySelectorAll(".lang-btn");

  /* ---------- Opening animation (index only, first visit / reload) ---------- */
  const finishLoading = () => {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    try {
      sessionStorage.setItem("edileNav", "1");
    } catch (e) {}
  };

  // Mark site navigation on every page so returning to index skips the loader
  try {
    if (!document.body.classList.contains("is-loading")) {
      sessionStorage.setItem("edileNav", "1");
    }
  } catch (e) {}

  if (document.body.classList.contains("is-loading")) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealDelay = reduceMotion ? 0 : 1000;
    const reveal = () => window.setTimeout(finishLoading, revealDelay);

    window.addEventListener("load", reveal, { once: true });
    if (document.readyState === "complete") reveal();
    // Safety: never block the page
    window.setTimeout(finishLoading, reduceMotion ? 200 : 2800);
  }

  /* ---------- Header scroll ---------- */
  const isInnerPage = document.body.classList.contains("page-inner");

  const updateHeader = () => {
    if (!header || isInnerPage) return;
    header.classList.toggle("is-scrolled", window.scrollY > 80);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  if (menuToggle && mobileMenu) {
    const icon = menuToggle.querySelector(".material-symbols-outlined");

    const setMenuOpen = (open) => {
      mobileMenu.hidden = !open;
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      if (icon) icon.textContent = open ? "close" : "menu";
      document.body.style.overflow = open ? "hidden" : "";
    };

    menuToggle.addEventListener("click", () => {
      setMenuOpen(mobileMenu.hidden);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    });
  }

  /* ---------- Hash scroll (expertises anchors) ---------- */
  window.addEventListener("hashchange", () => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  /* ---------- Counter animation (intro stats) ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const pad = Number(el.dataset.pad || 0);
    const duration = 1600;
    const start = performance.now();
    const parent = el.closest(".stat");

    if (parent) parent.classList.add("is-counting");

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value).padStart(pad, "0") + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = String(target).padStart(pad, "0") + suffix;
        if (parent) parent.classList.remove("is-counting");
      }
    };

    requestAnimationFrame(tick);
  };

  const startCounters = (root) => {
    const counters = (root || document).querySelectorAll("[data-count]");
    counters.forEach((el) => {
      if (el.dataset.counted === "true") return;
      el.dataset.counted = "true";
      animateCount(el);
    });
  };

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.target.id === "intro" || entry.target.querySelector("[data-count]")) {
              startCounters(entry.target);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    startCounters(document);
  }

  /* Respect reduced motion */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || "";
      const pad = Number(el.dataset.pad || 0);
      el.textContent = String(target).padStart(pad, "0") + suffix;
      el.dataset.counted = "true";
    });
  }

  /* ---------- Language toggle (UI only for now) ---------- */
  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      langButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
  });

  /* ---------- YouTube click-to-play ---------- */
  const ytFrame = document.querySelector("[data-youtube]");
  if (ytFrame) {
    const playBtn = ytFrame.querySelector(".presse-video-play");
    const videoId = ytFrame.getAttribute("data-youtube");

    const loadEmbed = () => {
      if (!videoId || ytFrame.classList.contains("is-playing")) return;

      // YouTube bloque souvent l’embed en file:// (Erreur 153)
      if (window.location.protocol === "file:") {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = "Comment lutter contre les injustices ? Sihem Souid est l’invitée de Adile Farquane";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      ytFrame.classList.add("is-playing");
      ytFrame.appendChild(iframe);
    };

    if (playBtn) {
      playBtn.addEventListener("click", loadEmbed);
    }
  }
  const filterButtons = document.querySelectorAll(".rea-filter");
  const projects = document.querySelectorAll(".rea-project");

  if (filterButtons.length && projects.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";

        filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));

        projects.forEach((project) => {
          const cats = (project.dataset.categories || "").split(/\s+/);
          const show = filter === "all" || cats.includes(filter);
          project.classList.toggle("is-filtered-out", !show);
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  if (contactForm && formStatus) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      formStatus.hidden = false;
      formStatus.classList.remove("is-error");

      if (!name || !email || !message) {
        formStatus.classList.add("is-error");
        formStatus.textContent = "Merci de renseigner votre nom, email et message.";
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formStatus.classList.add("is-error");
        formStatus.textContent = "Veuillez indiquer une adresse email valide.";
        return;
      }

      formStatus.textContent = "Merci. Votre demande a bien été prise en compte. Nous vous répondrons rapidement.";
      contactForm.reset();
    });
  }

  /* ---------- Hero background video ---------- */
  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      heroVideo.pause();
      heroVideo.removeAttribute("autoplay");
    } else {
      const play = heroVideo.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {});
      }
    }
  }
})();
