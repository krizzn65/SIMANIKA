"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";

/**
 * CalendarPlusIcon Component (21st.dev / AnimateIcons)
 * Animated calendar-plus icon with continuous looping animations.
 */
export function CalendarPlusIcon({
  size = 52,
  duration = 1,
  color = "currentColor",
  className = "",
  loop = true,
  loopDelay = 1800,
  ...props
}) {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (reduced) {
      controls.set("normal");
      return;
    }

    if (!loop) {
      controls.start("animate");
      return;
    }

    const runLoop = async () => {
      while (isMountedRef.current) {
        // Reset to initial invisible state
        controls.set("initial");
        // Animate paths sequentially
        await controls.start("animate");
        if (!isMountedRef.current) break;
        // Hold full state for user to view
        await new Promise((resolve) => setTimeout(resolve, loopDelay));
        if (!isMountedRef.current) break;
        // Smooth fade out before next loop cycle
        await controls.start("exit");
        if (!isMountedRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    runLoop();

    return () => {
      isMountedRef.current = false;
    };
  }, [controls, loop, loopDelay, reduced]);

  const bodyVariants = {
    initial: { pathLength: 0, opacity: 0 },
    normal: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [0, 1],
      opacity: [0, 1],
      transition: { duration: 0.55 * duration, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const hangerVariants = {
    initial: { pathLength: 0, opacity: 0 },
    normal: { pathLength: 1, opacity: 1 },
    animate: (i) => ({
      pathLength: [0, 1],
      opacity: [0, 1],
      transition: {
        duration: 0.32 * duration,
        delay: i * 0.09 * duration,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
    exit: {
      opacity: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const headerVariants = {
    initial: { scaleX: 0, opacity: 0 },
    normal: { scaleX: 1, opacity: 1 },
    animate: {
      scaleX: [0, 1],
      opacity: [0, 1],
      transition: {
        duration: 0.42 * duration,
        delay: 0.28 * duration,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const signVariants = {
    initial: { scale: 0, opacity: 0 },
    normal: { scale: 1, opacity: 1 },
    animate: (i) => ({
      scale: [0, 1.25, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.45 * duration,
        delay: (0.44 + i * 0.08) * duration,
        times: [0, 0.6, 1],
        ease: [0.34, 1.4, 0.64, 1],
      },
    }),
    exit: {
      opacity: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  return (
    <div
      className={`calendar-plus-animated ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        ...props.style,
      }}
      aria-hidden="true"
      {...props}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={controls}
        initial="initial"
        style={{ overflow: "visible" }}
      >
        <motion.path d="M8 2v4" custom={0} variants={hangerVariants} />
        <motion.path d="M16 2v4" custom={1} variants={hangerVariants} />
        <motion.path
          d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"
          variants={bodyVariants}
        />
        <motion.path
          d="M3 10h18"
          variants={headerVariants}
          style={{ transformBox: "view-box", originX: "3px", originY: "10px" }}
        />
        <motion.path
          d="M16 19h6"
          custom={0}
          variants={signVariants}
          style={{ transformBox: "view-box", originX: "19px", originY: "19px" }}
        />
        <motion.path
          d="M19 16v6"
          custom={1}
          variants={signVariants}
          style={{ transformBox: "view-box", originX: "19px", originY: "19px" }}
        />
      </motion.svg>
    </div>
  );
}
