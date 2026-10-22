"use client";

import { useState } from "react";
import AnimatedContent from "@/components/ui/AnimatedContent";

export function MissionAccordion({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <AnimatedContent stagger={0.08} distance={50} className="mission-accordion">
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        const panelId = `mission-panel-${item.index}`;
        const triggerId = `mission-trigger-${item.index}`;

        return (
          <article
            className={
              isActive
                ? "mission-accordion__item mission-accordion__item--active"
                : "mission-accordion__item"
            }
            key={item.index}
          >
            <button
              aria-controls={panelId}
              aria-expanded={isActive}
              className="mission-accordion__trigger"
              id={triggerId}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className="mission-accordion__index">// {item.index}</span>
              <span className="mission-accordion__title">{item.title}</span>
              <span className="mission-accordion__tag">{item.tag}</span>
            </button>

            <div
              aria-hidden={!isActive}
              aria-labelledby={triggerId}
              className="mission-accordion__panel"
              id={panelId}
              role="region"
            >
              <div className="mission-accordion__panel-inner">
                <p>{item.description}</p>
              </div>
            </div>
          </article>
        );
      })}
    </AnimatedContent>
  );
}
