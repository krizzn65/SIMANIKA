"use client";

import { useEffect, useRef } from "react";

export function InteractiveGrid({ className = "" }) {
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);
  const rafId = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    if (!container || !layer) return;

    const parent = container.parentElement;
    if (!parent) return;

    let parentRect = null;

    const updateRect = () => {
      parentRect = parent.getBoundingClientRect();
    };

    const update = () => {
      // Lerp
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.08;
      currentPos.current.y += dy * 0.08;

      layer.style.transform = `translate3d(${currentPos.current.x.toFixed(2)}px, ${currentPos.current.y.toFixed(2)}px, 0)`;

      // If close enough to target, stop loop to save CPU/GPU
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
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

    const handleMouseEnter = () => {
      updateRect();
    };

    const handleMouseMove = (e) => {
      if (!parentRect) {
        updateRect();
      }
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;

      const normalizedX = (x / parentRect.width - 0.5) * 2;
      const normalizedY = (y / parentRect.height - 0.5) * 2;

      targetPos.current = {
        x: normalizedX * 24,
        y: normalizedY * 24,
      };

      startLoop();
    };

    const handleMouseLeave = () => {
      targetPos.current = { x: 0, y: 0 };
      startLoop();
      parentRect = null;
    };

    const handleResize = () => {
      parentRect = null;
    };

    parent.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
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
      <div className="interactive-grid__layer" ref={layerRef} />
    </div>
  );
}
