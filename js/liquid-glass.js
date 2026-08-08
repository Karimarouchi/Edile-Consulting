/**
 * Liquid Glass — hero CTA
 * Au cold load le WebGL capture souvent une frame noire ; le scroll
 * force une re-capture. On simule ça dès l’init (markChanged + nudge).
 */
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n = 1) =>
  new Promise((resolve) => {
    let i = 0;
    const step = () => {
      i += 1;
      if (i >= n) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

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

const waitForVideoReady = (video, maxMs = 2500) =>
  new Promise((resolve) => {
    if (!video) {
      resolve(false);
      return;
    }

    const ok = () => video.readyState >= 2 && video.videoWidth > 0;

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
      video.removeEventListener("playing", onReady);
      video.removeEventListener("error", onError);
      resolve(value);
    };

    const onReady = () => {
      if (ok()) finish(true);
    };
    const onError = () => finish(false);

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onReady);
    video.addEventListener("error", onError);
    setTimeout(() => finish(ok()), maxMs);
  });

const ensureVideoBright = (video) => {
  if (!video) return;
  video.style.opacity = "1";
  video.setAttribute("data-dynamic", "");
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

/** Même effet qu’un scroll : force LiquidGlass à re-sampler la vidéo */
const wakeGlass = async (instance, root, video) => {
  if (!instance) return;

  const refresh = () => {
    try {
      if (video) instance.markChanged(video);
      instance.markChanged(root);
      instance.markChanged();
    } catch (_) {}
  };

  // Nudge --hero-cover (le scroll change ce transform → re-capture)
  const prev = root.style.getPropertyValue("--hero-cover");
  root.style.setProperty("--hero-cover", "0.02");
  refresh();
  await frames(2);

  root.style.setProperty("--hero-cover", prev || "0");
  refresh();
  await frames(2);

  // Resize = full re-capture dans la lib
  try {
    window.dispatchEvent(new Event("resize"));
  } catch (_) {}
  refresh();
  await frames(2);
};

const initHeroGlass = async () => {
  const root = document.querySelector("#liquid-glass-root");
  const glassElements = [...document.querySelectorAll("#liquid-glass-root .glass")];
  const video = root?.querySelector(".hero-video");

  if (!root || !glassElements.length) return;

  // CSS glass visible tout de suite (jamais de pastille noire)
  applyCssGlass(glassElements);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  await waitForReady();
  ensureVideoBright(video);

  const videoReady = await waitForVideoReady(video, 2500);
  await Promise.all([
    document.fonts?.ready
      ? Promise.race([document.fonts.ready.catch(() => {}), sleep(200)])
      : Promise.resolve(),
    sleep(videoReady ? 200 : 0),
  ]);
  await frames(2);

  if (!videoReady) {
    console.warn("[LiquidGlass:hero] video not ready — CSS glass kept");
    return;
  }

  try {
    const instance = await LiquidGlass.init({
      root,
      glassElements,
    });

    // Re-capture immédiate (comme après un scroll) AVANT de retirer le fallback
    await wakeGlass(instance, root, video);
    await sleep(120);
    await wakeGlass(instance, root, video);

    glassElements.forEach((el) => {
      el.classList.add("is-liquid");
      el.classList.remove("glass-fallback");
    });

    // Encore une fois une fois le bouton transparent (échantillon final)
    await frames(2);
    await wakeGlass(instance, root, video);

    // Filet de sécurité : si une frame noire reste, re-wake au premier scroll
    // est déjà géré par la lib ; on re-wake aussi après un court délai
    setTimeout(() => {
      wakeGlass(instance, root, video);
    }, 400);

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
