"use client";

// Adapted from React Bits Counter (David Haz). See SOURCES.md.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { countdownParts } from "@/lib/oprecAnnouncement.mjs";

function Digit({ value }) {
  const reduced = useReducedMotion();
  const last = useRef(value);
  const [previous, setPrevious] = useState(value);
  const progress = useSpring(1, { stiffness: 280, damping: 32, restDelta: 0.001 });
  const oldY = useTransform(progress, (v) => `${-v * 100}%`);
  const newY = useTransform(progress, (v) => `${(1 - v) * 100}%`);
  useEffect(() => {
    if (last.current === value) return;
    setPrevious(last.current);
    last.current = value;
    progress.jump(reduced ? 1 : 0);
    progress.set(1);
  }, [value, reduced, progress]);
  return <span className="oa-digit" aria-hidden="true">
    {!reduced && <motion.span style={{ y: oldY }}>{previous}</motion.span>}
    <motion.span style={{ y: reduced ? "0%" : newY }}>{value}</motion.span>
  </span>;
}

export function RollingCountdown({ target, serverNow, onElapsed }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Date.parse(target) - Date.parse(serverNow)));
  const callback = useRef(onElapsed);
  const notifiedTarget = useRef(null);
  callback.current = onElapsed;
  useEffect(() => {
    const started = performance.now();
    const initial = Date.parse(serverNow);
    let done = false;
    let timer;
    const tick = () => {
      const milliseconds = Math.max(0, Date.parse(target) - (initial + performance.now() - started));
      setRemaining(milliseconds);
      if (milliseconds === 0 && !done) { done = true; clearInterval(timer); if (notifiedTarget.current !== target) { notifiedTarget.current = target; callback.current?.(); } }
    };
    const resume = () => { clearInterval(timer); if (!document.hidden) { tick(); if (!done) timer = setInterval(tick, 1000); } };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", resume); };
  }, [target, serverNow]);
  const parts = countdownParts(remaining);
  return <div className="oa-countdown" role="timer" aria-live="off" aria-label={parts.map(([value, label]) => `${value} ${label}`).join(", ")}>
    {parts.map(([value, label]) => <div className="oa-countdown-part" key={label}><span className="oa-number">{String(value).padStart(2, "0").split("").map((digit, i) => <Digit key={i} value={digit} />)}</span><span className="oa-countdown-label">{label}</span></div>)}
  </div>;
}
