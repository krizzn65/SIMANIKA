"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion, useScroll } from "framer-motion";
import { prefersMotion } from "@/lib/motion";

let lenis = null;

// Scroll to an element, selector or offset through Lenis when it is running.
export function smoothScrollTo(target, options) {
  if (lenis) {
    lenis.scrollTo(target, options);
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else (typeof target === "string" ? document.querySelector(target) : target)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Pause smooth scrolling while a modal or menu owns the scroll.
export function useScrollLock(active) {
  useEffect(() => {
    if (!active || !lenis) return undefined;
    const instance = lenis;
    instance.stop();
    return () => instance.start();
  }, [active]);
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export function SmoothScroll() {
  useEffect(() => {
    if (!prefersMotion()) return undefined;
    const instance = new Lenis({ anchors: true, autoRaf: true });
    lenis = instance;
    return () => {
      instance.destroy();
      if (lenis === instance) lenis = null;
    };
  }, []);

  return <ScrollProgress />;
}
