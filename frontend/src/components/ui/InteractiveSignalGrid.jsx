"use client";

import { useEffect, useRef } from "react";

const COLUMNS = 13;
const ROWS = 10;
const CELLS = Array.from({ length: COLUMNS * ROWS });

export function InteractiveSignalGrid() {
  const rootRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => window.cancelAnimationFrame(frameRef.current),
    [],
  );

  const paintTrail = () => {
    const root = rootRef.current;

    if (!root) return;

    const bounds = root.getBoundingClientRect();
    const localX = pointerRef.current.x - bounds.left;
    const localY = pointerRef.current.y - bounds.top;
    const radius = Math.max(120, bounds.width * 0.24);
    const cellWidth = bounds.width / COLUMNS;
    const cellHeight = bounds.height / ROWS;

    root.style.setProperty("--signal-x", `${localX}px`);
    root.style.setProperty("--signal-y", `${localY}px`);

    root.querySelectorAll("[data-signal-cell]").forEach((cell, index) => {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const centerX = (column + 0.5) * cellWidth;
      const centerY = (row + 0.5) * cellHeight;
      const distance = Math.hypot(localX - centerX, localY - centerY);
      const strength = Math.max(0, 1 - distance / radius) ** 1.65;

      cell.style.setProperty("--trail-strength", strength.toFixed(3));
    });

    frameRef.current = 0;
  };

  const handlePointerMove = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };

    if (!frameRef.current) {
      frameRef.current = window.requestAnimationFrame(paintTrail);
    }
  };

  const handlePointerLeave = () => {
    const root = rootRef.current;

    if (!root) return;

    root.style.setProperty("--signal-x", "68%");
    root.style.setProperty("--signal-y", "42%");
    root.querySelectorAll("[data-signal-cell]").forEach((cell) => {
      cell.style.setProperty("--trail-strength", "0");
    });
  };

  return (
    <div
      aria-hidden="true"
      className="signal-grid"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={rootRef}
    >
      <div className="signal-grid__meta">
        <span>INTERACTIVE NODE MAP</span>
        <span>13 × 10</span>
      </div>

      <div className="signal-grid__matrix">
        {CELLS.map((_, index) => (
          <span
            className="signal-grid__cell"
            data-beacon={index % 19 === 7 || index % 31 === 12 ? "true" : undefined}
            data-signal-cell
            key={index}
            style={{ "--beacon-delay": `${(index % 8) * -0.7}s` }}
          />
        ))}
      </div>

      <span className="signal-grid__glow" />
      <div className="signal-grid__radar">
        <span className="signal-grid__ring signal-grid__ring--outer" />
        <span className="signal-grid__ring signal-grid__ring--inner" />
        <span className="signal-grid__orbit">
          <span />
        </span>
        <span className="signal-grid__core">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="signal-grid__footer">
        <span>NETWORK / ACTIVE</span>
        <span>130 NODES</span>
      </div>
    </div>
  );
}
