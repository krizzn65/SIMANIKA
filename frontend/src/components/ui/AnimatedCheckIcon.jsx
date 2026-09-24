"use client";

// Adapted from pqoqubbw/icons (MIT), listed as Lucide Animated on 21st.dev.
// Source: https://github.com/pqoqubbw/icons/blob/main/icons/check.tsx
import { motion, useReducedMotion } from "framer-motion";

export function AnimatedCheckIcon({ size = 16, active = false }) {
  const reduced = useReducedMotion();
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <motion.path d="M4 12 9 17L20 6" initial={false}
      animate={active && !reduced ? { opacity: [0, 1], pathLength: [0, 1], scale: [0.5, 1] } : { opacity: 1, pathLength: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.4, opacity: { duration: 0.1 } }} />
  </svg>;
}
