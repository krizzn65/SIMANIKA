"use client";

import { useEffect, useRef } from "react";
import { prefersMotion } from "@/lib/motion";

// Adapted from React Bits <AnimatedContent />. Differences, for this site:
// - triggered by IntersectionObserver instead of ScrollTrigger, so it works with
//   Lenis smooth scroll and does not ship ScrollTrigger;
// - GSAP is imported lazily (on idle), so it never delays the first paint;
// - content is only hidden while html.motion-ok is set (see globals.css) and is
//   released if GSAP cannot load, so it never stays invisible.
let gsapPromise;
const loadGsap = () => (gsapPromise ??= import("gsap").then((module) => module.gsap || module.default));

export default function AnimatedContent({
  as: Tag = "div",
  children,
  distance = 40,
  direction = "vertical",
  reverse = false,
  duration = 0.8,
  ease = "power3.out",
  initialOpacity = 0,
  scale = 1,
  blur = 0,
  threshold = 0.1,
  delay = 0,
  stagger = 0,
  staggerFrom = "start",
  className = "",
  style,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const done = () => { element.dataset.acDone = ""; };
    if (!prefersMotion()) { done(); return undefined; }

    let cancelled = false;
    let tween;
    const idle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 200));
    idle(() => loadGsap().catch(() => {}));

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadGsap().then((gsap) => {
        if (cancelled) return;
        const targets = stagger > 0 && element.children.length ? [...element.children] : [element];
        const axis = direction === "horizontal" ? "x" : "y";
        const from = { [axis]: distance * (reverse ? -1 : 1), scale, opacity: initialOpacity };
        if (blur > 0) from.filter = `blur(${blur}px)`;
        done();
        tween = gsap.fromTo(targets, from, {
          [axis]: 0, scale: 1, opacity: 1, filter: blur > 0 ? "blur(0px)" : undefined,
          duration, ease, delay,
          stagger: stagger > 0 ? { each: stagger, from: staggerFrom } : 0,
          // Hand transforms back to the element's own CSS (hover effects etc.).
          onComplete: () => gsap.set(targets, { clearProps: "transform,filter,opacity" }),
        });
      }).catch(done);
    }, { threshold: 0, rootMargin: `0px 0px -${Math.round(threshold * 100)}% 0px` });
    observer.observe(element);

    return () => { cancelled = true; observer.disconnect(); tween?.kill(); };
  }, [distance, direction, reverse, duration, ease, initialOpacity, scale, blur, threshold, delay, stagger, staggerFrom]);

  return (
    <Tag ref={ref} className={className} style={style} {...{ [stagger > 0 ? "data-ac-stagger" : "data-ac"]: "" }} {...rest}>
      {children}
    </Tag>
  );
}
