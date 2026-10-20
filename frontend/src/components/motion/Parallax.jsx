"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MOTION } from "@/lib/motion";

// Light vertical drift for one decorative visual per section.
export function Parallax({ as = "div", distance = MOTION.parallax, style, children, ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance / 2, -distance / 2]);
  const Tag = motion[as];
  return <Tag ref={ref} style={reduce ? style : { ...style, y }} {...rest}>{children}</Tag>;
}
