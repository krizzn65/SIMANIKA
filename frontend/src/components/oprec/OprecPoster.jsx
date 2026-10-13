"use client";

import { useEffect, useRef, useState } from "react";
import "./oprec-poster.css";

// The same 20 × 9 curtain and stagger are used by both public OPREC cards.
const CURTAIN_BLOCKS = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: 20 }, (_, col) => ({ row, col }))
    .filter(({ col }) => col < 4 || col >= 16)
    .map(({ col }) => ({
      key: `${row}-${col}`,
      top: `${row / 9 * 100}%`,
      left: `${col / 20 * 100}%`,
      delay: Number((row * 0.075 + (col < 4 ? 3 - col : col - 16) * 0.055).toFixed(3)),
    }))
).flat();

export function OprecPoster({ src, title, alt = title, active, className = "", children }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const image = useRef(null);
  useEffect(() => {
    // A lazy image can fail before hydration attaches its error handler.
    if (image.current?.complete && !image.current.naturalWidth) setFailedSrc(src);
  }, [src]);
  return <div className={`oprec-preview__art ${active ? "oprec-poster--active" : ""} ${className}`}>
    {src && failedSrc !== src ? <img ref={image} src={src} alt={alt} className="oprec-preview__poster-img"
      loading="lazy" decoding="async" onError={() => setFailedSrc(src)} /> : (
      <div className="oprec-preview__fallback-wrap">{children}</div>
    )}
    <div className="oprec-preview__art-vignette" aria-hidden="true" />
    <div className="oprec-preview__art-glow" aria-hidden="true" />
    <div className="oprec-preview__curtain" aria-hidden="true">
      {CURTAIN_BLOCKS.map((block) => <div key={block.key} className="oprec-curtain-block" style={{
        top: block.top, left: block.left, width: "5%", height: `${100 / 9}%`,
        transitionDelay: `${active ? block.delay : Number((block.delay * 0.25).toFixed(3))}s`,
      }} />)}
    </div>
    <div className="oprec-preview__art-overlay" aria-hidden="true">
      <h4 className="oprec-preview__art-title">{title}</h4>
    </div>
  </div>;
}
