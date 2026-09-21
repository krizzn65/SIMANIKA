"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/* ── Stagger slot positioning configurations ──
   Offset relative to center card:
   slot -3, -2, -1, 0 (center), 1, 2, 3
*/
const SLOTS = [
  { index: -3, x: -58, y: 3.2, rot: -10, scale: 0.76, zIndex: 1, opacity: 0 },
  { index: -2, x: -40, y: 2.2, rot: -6,  scale: 0.84, zIndex: 2, opacity: 0.5 },
  { index: -1, x: -21, y: 1.0, rot: -3,  scale: 0.92, zIndex: 5, opacity: 0.85 },
  { index:  0, x:   0, y: 0.0, rot:  0,  scale: 1.05, zIndex: 10, opacity: 1 },
  { index:  1, x:  21, y: 1.0, rot:  3,  scale: 0.92, zIndex: 5, opacity: 0.85 },
  { index:  2, x:  40, y: 2.2, rot:  6,  scale: 0.84, zIndex: 2, opacity: 0.5 },
  { index:  3, x:  58, y: 3.2, rot: 10,  scale: 0.76, zIndex: 1, opacity: 0 },
];

function getResponsiveMult(width) {
  if (width < 480) return 0.38;
  if (width < 640) return 0.52;
  if (width < 768) return 0.68;
  if (width < 1024) return 0.85;
  if (width < 1280) return 1.0;
  return 1.15;
}

export function StaggerTestimonials({ testimonials = [] }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const isAnimating = useRef(false);
  const total = testimonials.length;

  const getSlotForIndex = useCallback(
    (index, active) => {
      let diff = index - active;
      // Circular shortest distance
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;

      if (diff <= -3) return SLOTS[0];
      if (diff === -2) return SLOTS[1];
      if (diff === -1) return SLOTS[2];
      if (diff === 0)  return SLOTS[3];
      if (diff === 1)  return SLOTS[4];
      if (diff === 2)  return SLOTS[5];
      return SLOTS[6];
    },
    [total],
  );

  const applyLayout = useCallback(
    (targetActive, isImmediate = false) => {
      if (!total) return;
      const width = typeof window !== "undefined" ? window.innerWidth : 1200;
      const mult = getResponsiveMult(width);

      testimonials.forEach((_, i) => {
        const el = cardRefs.current[i];
        if (!el) return;

        const slot = getSlotForIndex(i, targetActive);
        const isActive = slot.index === 0;

        const target = {
          x: `${slot.x * mult}rem`,
          y: `${slot.y}rem`,
          rotation: slot.rot,
          scale: slot.scale,
          opacity: slot.opacity,
          zIndex: slot.zIndex,
          pointerEvents: Math.abs(slot.index) <= 2 ? "auto" : "none",
        };

        if (isImmediate) {
          gsap.set(el, target);
        } else {
          gsap.to(el, {
            ...target,
            duration: 0.65,
            ease: "power3.out",
            overwrite: "auto",
            onComplete: () => {
              isAnimating.current = false;
            },
          });
        }

        // Toggle active styling class
        if (isActive) {
          el.classList.add("stagger-card--active");
        } else {
          el.classList.remove("stagger-card--active");
        }
      });
    },
    [testimonials, total, getSlotForIndex],
  );

  // Initial mount layout
  useEffect(() => {
    applyLayout(activeIndex, true);

    const onResize = () => {
      applyLayout(activeIndex, true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, applyLayout]);

  const goTo = useCallback(
    (index) => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      const newIndex = ((index % total) + total) % total;
      setActiveIndex(newIndex);
      applyLayout(newIndex, false);
    },
    [total, applyLayout],
  );

  const prev = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  // Touch swipe handling
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (!total) return null;

  return (
    <div
      className="stagger-testimonials"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Testimoni Mahasiswa dan Alumni SIMANIKA"
    >
      <div className="stagger-testimonials__stage" ref={containerRef}>
        {testimonials.map((item, index) => {
          const slot = getSlotForIndex(index, activeIndex);
          const isActive = slot.index === 0;

          return (
            <article
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`stagger-card ${isActive ? "stagger-card--active" : ""}`}
              onClick={() => {
                if (!isActive) goTo(index);
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Testimoni ${index + 1} dari ${total}: ${item.name}`}
              aria-hidden={!isActive}
            >
              <div className="stagger-card__dogear" aria-hidden="true" />

              <div className="stagger-card__content">
                <div className="stagger-card__author-header">
                  <div className="stagger-card__avatar-wrap">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="stagger-card__avatar"
                        loading="lazy"
                        width={44}
                        height={44}
                      />
                    ) : (
                      <div className="stagger-card__avatar-fallback">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <blockquote className="stagger-card__quote">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                <footer className="stagger-card__footer">
                  <cite className="stagger-card__name">
                    &mdash; {item.name}
                    {item.role && (
                      <span className="stagger-card__role">, {item.role}</span>
                    )}
                  </cite>
                </footer>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation Buttons (Segmented pill style matching 21st.dev) */}
      <div className="stagger-nav">
        <button
          type="button"
          onClick={prev}
          className="stagger-nav__btn"
          aria-label="Testimoni sebelumnya"
          title="Sebelumnya"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="stagger-nav__divider" aria-hidden="true" />

        <button
          type="button"
          onClick={next}
          className="stagger-nav__btn"
          aria-label="Testimoni berikutnya"
          title="Berikutnya"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
