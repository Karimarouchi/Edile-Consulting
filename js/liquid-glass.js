/**
 * Liquid Glass — hero CTA (chargement rapide)
 * 1) Fallback CSS immédiat  2) Init WebGL dès que possible
 */
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForReady = () =>
  new Promise((resolve) => {
    if (
      document.body.classList.contains("is-ready") ||
      document.body.classList.contains("is-internal-nav")
    ) {
      resolve();
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("is-ready")) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    // Ne jamais bloquer plus d’1s le glass CTA
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 1000);
  });

const waitForVideoBrief = (video) =>
  new Promise((resolve) => {
    if (!video || video.readyState >= 2) {
      resolve();
      return;
    }
    const done = () => resolve();
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
    video.addEventListener("error", done, { once: true });
    // Max 350ms — ne pas attendre la vidéo entière
    setTimeout(done, 350);
  });

const initHeroGlass = async () => {
  const root = document.querySelector("#liquid-glass-root");
  const glassElements = document.querySelectorAll("#liquid-glass-root .glass");
  const video = root?.querySelector(".hero-video");

  if (!root || !glassElements.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    glassElements.forEach((el) => el.classList.add("glass-fallback"));
    return;
  }

  // Visible immédiatement (look glass CSS) — pas d’attente WebGL
  glassElements.forEach((el) => {
    el.classList.add("glass-fallback", "glass-ready");
    el.dataset.config = JSON.stringify({
      blurAmount: 0.25,
      cornerRadius: 30,
      button: true,
    });
  });

  const internalNav = document.body.classList.contains("is-internal-nav");

  if (!internalNav) {
    await waitForReady();
  }

  // Attentes courtes / parallèles
  await Promise.all([
    waitForVideoBrief(video),
    document.fonts?.ready
      ? Promise.race([document.fonts.ready.catch(() => {}), sleep(150)])
      : Promise.resolve(),
  ]);

  // Une frame pour peindre le fallback, puis WebGL
  await new Promise((r) => requestAnimationFrame(r));

  try {
    const instance = await LiquidGlass.init({
      root,
      glassElements,
    });

    glassElements.forEach((el) => {
      el.classList.add("is-liquid");
      el.classList.remove("glass-fallback");
    });

    window.addEventListener(
      "pagehide",
      () => {
        try {
          instance.destroy();
        } catch (_) {}
      },
      { once: true }
    );
  } catch (err) {
    console.warn("[LiquidGlass:hero] init skipped:", err);
    // glass-fallback déjà en place
  }
};

initHeroGlass();
