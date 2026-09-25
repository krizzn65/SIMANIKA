"use client";

import { useEffect, useRef, useState } from "react";
import { eventDate } from "@/lib/events";

export function EventTimelineScroller({ items }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: items.length <= 1 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateEdges = () => setEdges({
      start: track.scrollLeft <= 2,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length]);

  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.75, 220), behavior: reduceMotion ? "auto" : "smooth" });
  };

  return <div className="event-showcase__timeline-frame">
    <ol ref={trackRef} className="event-showcase__timeline" aria-label="Tahapan event" tabIndex={0} onScroll={(event) => {
      const track = event.currentTarget;
      setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 });
    }}>
      {items.map((item, index) => <li key={`${item.type || item.judul}-${item.batch || 0}-${index}`}>
        <div className="event-showcase__timeline-card">
          <span className="event-showcase__timeline-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h3 title={item.judul}>{item.judul}</h3>
          <time dateTime={item.tanggal}>{eventDate(item.tanggal)}</time>
        </div>
      </li>)}
    </ol>
    <div className="event-showcase__timeline-footer">
      <span>{edges.start && edges.end ? "Semua agenda terlihat" : "Geser untuk melihat agenda lainnya"}</span>
      <div className="event-showcase__timeline-controls">
        <button type="button" aria-label="Agenda sebelumnya" onClick={() => move(-1)} disabled={edges.start}>←</button>
        <button type="button" aria-label="Agenda berikutnya" onClick={() => move(1)} disabled={edges.end}>→</button>
      </div>
    </div>
  </div>;
}
