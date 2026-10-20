"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { MOTION, prefersMotion } from "@/lib/motion";

// Counts from 0 to `to` once visible. The final value is rendered in the HTML
// and reserves the width, so the surrounding text never shifts.
export function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !prefersMotion()) return undefined;
    node.textContent = `0${suffix}`;
    let controls;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      controls = animate(0, to, {
        duration: MOTION.duration * 2,
        ease: MOTION.ease,
        onUpdate: (value) => { node.textContent = `${Math.round(value)}${suffix}`; },
      });
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [to, suffix]);

  return (
    <span className="count-up">
      <span aria-hidden="true" className="count-up__size">{to}{suffix}</span>
      <span ref={ref} className="count-up__value">{to}{suffix}</span>
    </span>
  );
}
