/**
 * Liquid Glass — Notre équipe (cartes dans #team-glass-root)
 */
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js";

const ROOT_SEL = "#team-glass-root";
const GLASS_SEL = "#team-glass-root .glass";
const CARD_SEL = "#team-glass-root .team-card";

const canUseGlass = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(max-width: 768px)").matches) return false;
  return true;
};

const waitForSectionVisible = (section) =>
  new Promise((resolve) => {
    if (!section || section.classList.contains("is-visible")) {
      resolve();
      return;
    }
    const observer = new MutationObserver(() => {
      if (section.classList.contains("is-visible")) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(section, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 4000);
  });

const applyConfigs = (elements) => {
  elements.forEach((element) => {
    const featured = element.classList.contains("team-card--featured");
    element.dataset.config = JSON.stringify({
      blurAmount: 0.22,
      refraction: featured ? 1.18 : 1.16,
      chromAberration: 0,
      edgeHighlight: 0.12,
      specular: 0.12,
      fresnel: 1.2,
      distortion: 0.015,
      cornerRadius: featured ? 80 : 74,
      zRadius: 42,
      opacity: 0.94,
      saturation: 0.02,
      brightness: 0.03,
      shadowOpacity: 0.22,
      shadowSpread: 12,
      button: true,
    });
  });
};

const bindCardSheen = (cards) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return;

  cards.forEach((card) => {
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty("--mouse-y", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    const onLeave = () => {
      card.style.removeProperty("--mouse-x");
      card.style.removeProperty("--mouse-y");
    };
    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
  });
};

const initTeamGlass = async () => {
  const root = document.querySelector(ROOT_SEL);
  const section = document.getElementById("equipe");
  const glassElements = document.querySelectorAll(GLASS_SEL);
  const cards = document.querySelectorAll(CARD_SEL);

  if (!root || !glassElements.length) return;

  glassElements.forEach((el) => el.classList.add("glass-css"));
  bindCardSheen(cards);

  if (!canUseGlass()) return;

  await waitForSectionVisible(section);
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  applyConfigs(glassElements);
  await new Promise((r) => setTimeout(r, 700));

  let instance = null;
  try {
    instance = await LiquidGlass.init({ root, glassElements });
    glassElements.forEach((el) => el.classList.add("is-liquid"));
  } catch (err) {
    console.warn("[LiquidGlass:team] init skipped:", err);
    return;
  }

  const destroy = () => {
    if (!instance) return;
    try {
      instance.destroy();
    } catch (_) {}
    instance = null;
  };

  window.addEventListener("pagehide", destroy, { once: true });

  const mq = window.matchMedia("(max-width: 768px)");
  const onViewport = (e) => {
    if (e.matches) destroy();
  };
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onViewport);
  else if (typeof mq.addListener === "function") mq.addListener(onViewport);
};

initTeamGlass();
