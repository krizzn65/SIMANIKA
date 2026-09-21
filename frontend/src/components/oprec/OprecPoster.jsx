"use client";
import { useState } from "react";

export function OprecPoster({ src, alt, periode }) {
  const [failed, setFailed] = useState(false);
  return <div className="oprec-poster">
    {src && !failed ? <img src={src} alt={alt} width="900" height="1200" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <div className="oprec-poster__fallback">
      <span className="oprec-mono">HIMANIKA / OPEN RECRUITMENT</span>
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M20 102h78M30 102V18h55v84M42 102V30l30-7v79M55 63h5M78 60h31m-10-10 10 10-10 10"/></svg>
      <strong>YOUR NEXT<br />CHAPTER.</strong><span className="oprec-mono">{periode ? `PERIODE ${periode}` : "MULAI PERJALANANMU DI SINI"}</span>
      {failed && <small>Poster belum dapat ditampilkan.</small>}
    </div>}
  </div>;
}
