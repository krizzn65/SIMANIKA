// Single source of truth for scroll-motion timing on public pages.
export const MOTION = {
  duration: 0.7, // seconds, within the 500–800ms range
  ease: [0.22, 1, 0.36, 1] as const,
  revealDistance: 24, // px
  stagger: 0.07, // seconds between list items
  heroStagger: 0.08, // seconds between hero supporting elements
  parallax: 40, // px, maximum travel
  navThreshold: 80, // px scrolled before the navbar changes
};

const motionEaseCss = `cubic-bezier(${MOTION.ease.join(", ")})`;

// CSS custom properties consumed by the reveal rules in globals.css.
export const motionCssVars = `:root{--motion-duration:${MOTION.duration * 1000}ms;--motion-ease:${motionEaseCss};--motion-distance:${MOTION.revealDistance}px;--motion-stagger:${MOTION.stagger * 1000}ms}`;

// Runs before paint: hide-until-revealed styles only apply when motion is
// allowed and JavaScript is running, so content is always readable otherwise.
export const motionBootScript = "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-ok')}catch(e){}";

export const prefersMotion = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("motion-ok");
