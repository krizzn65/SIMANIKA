"use client";

import { useEffect, useRef } from "react";
import { MOTION, prefersMotion } from "@/lib/motion";

// Reveals its element (or, with `stagger`, each direct child) once, when it
// first enters the viewport. Renders the element itself, so no extra wrapper.
export function InView({ as: Tag = "div", stagger = false, delay = 0, style, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !prefersMotion()) return undefined;

    const items = stagger ? [...element.children] : [];
    items.forEach((child, index) => child.style.setProperty("--reveal-i", index));
    const total = (MOTION.duration + delay + items.length * MOTION.stagger) * 1000;

    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      element.dataset.inview = "";
      // Hand transitions back to the element's own styles (e.g. hover).
      timer = window.setTimeout(() => { element.dataset.revealed = ""; }, total);
    }, { rootMargin: "0px 0px -10% 0px" });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [stagger, delay]);

  return (
    <Tag
      ref={ref}
      {...{ [stagger ? "data-reveal-stagger" : "data-reveal"]: "" }}
      style={delay ? { ...style, "--reveal-delay": `${delay * 1000}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
