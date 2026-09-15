"use client";

import { useEffect, useRef } from "react";

export function GameCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");

    if (!cursor || !finePointer.matches) return undefined;

    let animationFrame = 0;
    let pendingX = 0;
    let pendingY = 0;
    let isHoveringInteractive = false;
    let isVisible = false;

    document.documentElement.classList.add("game-cursor-enabled");

    const render = () => {
      cursor.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`;
      if (!isVisible) {
        cursor.classList.add("game-cursor--visible");
        isVisible = true;
      }
      cursor.classList.toggle("game-cursor--interactive", isHoveringInteractive);
      animationFrame = 0;
    };

    const moveCursor = (event) => {
      if (event.pointerType !== "mouse") return;

      pendingX = event.clientX;
      pendingY = event.clientY;
      const target = event.target;
      isHoveringInteractive = target instanceof Element && Boolean(target.closest("a, button, [role='button'], input, select, textarea"));

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const pressCursor = () => cursor.classList.add("game-cursor--pressed");
    const releaseCursor = () => cursor.classList.remove("game-cursor--pressed");
    const hideCursor = (event) => {
      if (!event.relatedTarget) {
        cursor.classList.remove("game-cursor--visible");
        isVisible = false;
      }
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", pressCursor, { passive: true });
    window.addEventListener("pointerup", releaseCursor, { passive: true });
    window.addEventListener("mouseout", hideCursor);
    window.addEventListener("blur", releaseCursor);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      document.documentElement.classList.remove("game-cursor-enabled");
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", pressCursor);
      window.removeEventListener("pointerup", releaseCursor);
      window.removeEventListener("mouseout", hideCursor);
      window.removeEventListener("blur", releaseCursor);
    };
  }, []);

  return (
    <div aria-hidden="true" className="game-cursor" ref={cursorRef}>
      <svg
        className="game-cursor__sprite"
        viewBox="0 0 36 42"
        fill="none"
        shapeRendering="crispEdges"
      >
        <path
          className="game-cursor__fill"
          d="M3 2v31h8v7h7V28h10v-7h-5v-5h-5v-5h-5V6H8V2H3Z"
        />
        <path
          className="game-cursor__outline"
          d="M0 0h10v4h5v5h5v5h5v5h8v11H21v12H9v-7H1V0h-1Zm5 5v25h8v7h3V25h12v-2h-7v-5h-5v-5h-5V8H6V5H5Z"
        />
        <path className="game-cursor__accent" d="M21 30h5v9h-5v-9Z" />
      </svg>
      <span className="game-cursor__pixel game-cursor__pixel--one" />
      <span className="game-cursor__pixel game-cursor__pixel--two" />
    </div>
  );
}
