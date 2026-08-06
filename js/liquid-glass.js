/**
 * Hero CTA — glass CSS uniquement
 * Le WebGL LiquidGlass échantillonne la vidéo : sur GitHub / au loading /
 * navigation interne, ça devient souvent un bouton noir.
 * On garde un glass CSS stable (identique au design voulu).
 */

const markReady = () => {
  const glassElements = document.querySelectorAll("#liquid-glass-root .glass");
  if (!glassElements.length) return;

  glassElements.forEach((el) => {
    el.classList.add("glass-fallback", "glass-ready");
    el.classList.remove("is-liquid", "liquid-glass-button");
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", markReady, { once: true });
} else {
  markReady();
}
