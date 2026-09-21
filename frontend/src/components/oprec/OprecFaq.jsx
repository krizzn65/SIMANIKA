"use client";

import { useState } from "react";

export function OprecFaq({ faq }) {
  const [openIndices, setOpenIndices] = useState(new Set());

  const toggle = (i) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  return (
    <div className="oprec-faq">
      {faq.map((item, i) => {
        const isOpen = openIndices.has(i);
        const panelId = `oprec-faq-panel-${i}`;
        const buttonId = `oprec-faq-trigger-${i}`;

        return (
          <div
            key={i}
            className={`oprec-faq__item ${isOpen ? "oprec-faq__item--open" : ""}`}
          >
            <button
              id={buttonId}
              type="button"
              className="oprec-faq__trigger"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="oprec-faq__question">{item.pertanyaan}</span>
              <span className="oprec-faq__plus" aria-hidden="true">
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="oprec-faq__panel"
            >
              <div className="oprec-faq__panel-inner">
                <p className="oprec-faq__answer">{item.jawaban}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
