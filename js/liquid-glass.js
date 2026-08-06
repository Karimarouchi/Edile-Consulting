/**
 * Liquid Glass — hero CTA
 * Toujours un glass CSS visible d’abord.
 * WebGL seulement quand la vidéo est assez claire (évite le bouton noir au cold load / GitHub).
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
      if (
        document.body.classList.contains("is-ready") ||
        document.body.classList.contains("is-internal-nav")
      ) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 1200);
  });

const waitForVideoReady = (video, maxMs = 2200) =>
  new Promise((resolve) => {
    if (!video) {
      resolve(false);
      return;
    }

    const ok = () => video.readyState >= 2 && !video.ended;

    if (ok()) {
      resolve(true);
      return;
    }

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      resolve(value);
    };

    const onReady = () => finish(ok());
    const onError = () => finish(false);

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
    setTimeout(() => finish(ok()), maxMs);
  });

const ensureVideoBright = (video) => {
  if (!video) return;
  // Aligné sur is-internal-nav : le sampling WebGL a besoin d’une vidéo lisible
  video.style.opacity = "1";
  try {
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  } catch (_) {}
};

const applyCssGlass = (els) => {
  els.forEach((el) => {
    el.classList.add("glass-fallback", "glass-ready");
    el.classList.remove("is-liquid");
    el.dataset.config = JSON.stringify({
      blurAmount: 0.25,
      cornerRadius: 30,
      button: true,
    });
  });
};

const initHeroGlass = async () => {
  const root = document.querySelector("#liquid-glass-root");
  const glassElements = [...document.querySelectorAll("#liquid-glass-root .glass")];
  const video = root?.querySelector(".hero-video");

  if (!root || !glassElements.length) return;

  // Glass CSS immédiat — jamais de bouton noir pendant le loading
  applyCssGlass(glassElements);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  await waitForReady();
  ensureVideoBright(video);

  const videoReady = await waitForVideoReady(video, 2200);
  await Promise.all([
    document.fonts?.ready
      ? Promise.race([document.fonts.ready.catch(() => {}), sleep(200)])
      : Promise.resolve(),
    // Laisser le hero-video-in / paint atteindre une frame claire
    sleep(videoReady ? 280 : 0),
  ]);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Sans frame vidéo utilisable → garder le glass CSS (look correct)
  if (!videoReady) {
    console.warn("[LiquidGlass:hero] video not ready — CSS glass kept");
    return;
  }

  try {
    const instance = await LiquidGlass.init({
      root,
      glassElements,
    });

    // Une frame WebGL avant de retirer le fallback (évite flash noir)
    await new Promise((r) => requestAnimationFrame(r));
    await sleep(80);

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
    console.warn("[LiquidGlass:hero] init skipped — CSS glass kept:", err);
    applyCssGlass(glassElements);
  }
};

initHeroGlass();
