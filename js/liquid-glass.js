/**
 * Liquid Glass — hero CTA
 * Pendant le loader : prépare vidéo + WebGL sous le voile.
 * N’ouvre la page (edile:glass-ready) que quand le bouton est prêt.
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

const signalGlassReady = () => {
  document.body.classList.add("glass-cta-ready");
  window.dispatchEvent(new CustomEvent("edile:glass-ready"));
};

const waitForVideoReady = (video, maxMs = 2800) =>
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

const wakeGlass = async (instance, root, video) => {
  if (!instance) return;

  const refresh = () => {
    try {
      if (video) instance.markChanged(video);
      instance.markChanged(root);
      instance.markChanged();
    } catch (_) {}
  };

  const prev = root.style.getPropertyValue("--hero-cover");
  root.style.setProperty("--hero-cover", "0.025");
  refresh();
  await frames(2);

  root.style.setProperty("--hero-cover", prev || "0");
  refresh();
  await frames(2);

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

  if (!root || !glassElements.length) {
    signalGlassReady();
    return;
  }

  applyCssGlass(glassElements);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    signalGlassReady();
    return;
  }

  // Préparer SOUS le loader — ne pas attendre is-ready
  document.body.classList.add("glass-cta-preparing");
  ensureVideoBright(video);

  const videoReady = await waitForVideoReady(video, 2800);
  await Promise.all([
    document.fonts?.ready
      ? Promise.race([document.fonts.ready.catch(() => {}), sleep(250)])
      : Promise.resolve(),
    sleep(videoReady ? 160 : 0),
  ]);
  await frames(3);

  if (!videoReady) {
    console.warn("[LiquidGlass:hero] video not ready — CSS glass kept");
    document.body.classList.remove("glass-cta-preparing");
    signalGlassReady();
    return;
  }

  try {
    const instance = await LiquidGlass.init({
      root,
      glassElements,
    });

    // Re-captures pendant que le loader cache encore le hero
    await wakeGlass(instance, root, video);
    await sleep(100);
    await wakeGlass(instance, root, video);

    glassElements.forEach((el) => {
      el.classList.add("is-liquid");
      el.classList.remove("glass-fallback");
    });

    await frames(2);
    await wakeGlass(instance, root, video);
    await sleep(80);
    await wakeGlass(instance, root, video);

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

  document.body.classList.remove("glass-cta-preparing");
  // Bouton prêt → le loader peut s’ouvrir
  signalGlassReady();
};

initHeroGlass();
