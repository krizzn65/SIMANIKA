"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const COLLAPSE_AFTER = 320; // characters; shorter descriptions show in full

// Hero description. Long admin-written briefs (requirements, benefits,
// contacts) sit in a card that starts collapsed so the hero stays balanced.
export function OprecBrief({ text }) {
  const [open, setOpen] = useState(false);
  const long = text.length > COLLAPSE_AFTER;

  if (!long) return <p className="oprec-hero__lead">{text}</p>;

  return (
    <div className={`oprec-brief${open ? " oprec-brief--open" : ""}`}>
      <span className="oprec-mono oprec-brief__label">INFORMASI PENDAFTARAN</span>
      <p id="oprec-brief-text" className="oprec-brief__text">{text}</p>
      <button type="button" className="oprec-brief__toggle" aria-expanded={open} aria-controls="oprec-brief-text" onClick={() => setOpen((value) => !value)}>
        {open ? "Tutup" : "Baca selengkapnya"} <ChevronDown size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
