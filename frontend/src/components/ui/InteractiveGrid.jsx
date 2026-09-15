"use client";

import { useEffect, useRef } from "react";

export function InteractiveGrid({ className = "" }) {
  const containerRef = useRef(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);
  const rafId = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement;
    if (!parent) return;

    const update = () => {
      // Lerp
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.08;
      currentPos.current.y += dy * 0.08;

      container.style.setProperty("--grid-offset-x", `${currentPos.current.x.toFixed(2)}px`);
      container.style.setProperty("--grid-offset-y", `${currentPos.current.y.toFixed(2)}px`);

      // If close enough to target, stop loop to save CPU/GPU
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafId.current = requestAnimationFrame(update);
      } else {
        isMoving.current = false;
        rafId.current = null;
      }
    };

    const startLoop = () => {
      if (!isMoving.current) {
        isMoving.current = true;
        rafId.current = requestAnimationFrame(update);
      }
    };

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normalizedX = (x / rect.width - 0.5) * 2;
      const normalizedY = (y / rect.height - 0.5) * 2;

      targetPos.current = {
        x: normalizedX * 24,
        y: normalizedY * 24,
      };

      startLoop();
    };

    const handleMouseLeave = () => {
      targetPos.current = { x: 0, y: 0 };
      startLoop();
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`interactive-grid ${className}`}
    >
      <div className="interactive-grid__layer" />
    </div>
  );
}
