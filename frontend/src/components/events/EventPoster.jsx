"use client";

import { useState } from "react";

export function EventPoster({ src, title, eager = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="event-poster">
      {src && !failed ? (
        <img src={src} alt={`Poster ${title}`} width="960" height="600" loading={eager ? "eager" : "lazy"}
          decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="event-poster__fallback" aria-label={`Poster untuk ${title} belum tersedia`} role="img">
          <span className="event-mono">HIMANIKA / EVENT</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h3m4 0h3m-10 3h3"/></svg>
          <span>Ruang untuk<br />langkah berikutnya.</span>
        </div>
      )}
    </div>
  );
}
