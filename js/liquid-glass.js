/**
 * Liquid Glass — Frosted Glass CTA (same preset as liquid-glass.ybouane.com)
 */
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js";

const waitForReady = () =>
  new Promise((resolve) => {
    if (document.body.classList.contains("is-ready")) {
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
  });

const waitForVideo = (video) =>
  new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    if (video.readyState >= 2) {
      resolve();
      return;
    }
    const done = () => resolve();
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("error", done, { once: true });
    setTimeout(done, 2500);
  });

const initHeroGlass = async () => {
  const root = document.querySelector("#liquid-glass-root");
  const glassElements = document.querySelectorAll(".glass");
  const video = root?.querySelector(".hero-video");

  if (!root || !glassElements.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  await waitForReady();
  await waitForVideo(video);

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  // Official "Frosted Glass" preset from the docs + button mode
  glassElements.forEach((element) => {
    element.dataset.config = JSON.stringify({
      blurAmount: 0.25,
      cornerRadius: 30,
      button: true,
    });
  });

  // First paint after entrance so capture isn't empty/transparent
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 80)));

  try {
    const instance = await LiquidGlass.init({
      root,
      glassElements,
    });

    glassElements.forEach((el) => el.classList.add("is-liquid"));

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
    console.warn("[LiquidGlass] init skipped:", err);
    glassElements.forEach((el) => el.classList.add("glass-fallback"));
  }
};

initHeroGlass();
