"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7,  scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
  { rot: 7,   scale: 0.9346, x: 11,  y: 1.3, zIndex: 3 },
  { rot: 14,  scale: 0.8498, x: 22,  y: 4.0, zIndex: 2 },
  { rot: 21,  scale: 0.7756, x: 30,  y: 7.3, zIndex: 1 },
];

function getResponsiveMultiplier(width) {
  // Mobile & Tablet: KEEP EXACTLY AS IS
  if (width < 480) return 0.28;
  if (width < 640) return 0.38;
  if (width < 768) return 0.5;
  if (width < 1024) return 0.75;

  // Desktop (>= 1024px): scale so cards reach edge-to-edge ("mentok kiri-kanan") exactly like mobile
  if (width < 1200) return 1.35;
  if (width < 1366) return 1.55;
  if (width < 1536) return 1.75;
  if (width < 1728) return 1.95;
  return 2.2;
}

function getHeightMultiplier(width) {
  let idealPx;
  if (width < 480) idealPx = 22 * 16;
  else if (width < 640) idealPx = 26 * 16;
  else if (width < 768) idealPx = 28 * 16;
  else if (width < 1024) idealPx = 34 * 16;
  else idealPx = 46 * 16;

  if (typeof window === "undefined") return 1;
  const available = window.innerHeight * 0.85;
  if (available >= idealPx) return 1;
  return Math.max(0.85, available / idealPx);
}

function getSlotConfig(totalCards, slot) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  if (totalCards <= 1) {
    return { rot: 0, scale: 1.0, x: 0, y: 0, zIndex: 10 };
  }
  const offset = slot - (totalCards - 1) / 2;
  const absOffset = Math.abs(offset);
  return {
    rot: offset * 7,
    scale: Math.max(0.75, 1.0 - 0.045 * absOffset * absOffset),
    x: offset * 11,
    y: absOffset * absOffset * 1.3,
    zIndex: Math.round(10 - absOffset),
  };
}

export function CardFanCarousel({ cards }) {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef(null);
  const prevVisible = useRef(new Set());

  const totalCards = cards.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(
    needsPagination ? HALF : Math.floor(totalCards / 2),
  );
  const [loadedIndices, setLoadedIndices] = useState(
    () => new Set(Array.from({ length: Math.min(totalCards, MAX_VISIBLE) }, (_, index) => index)),
  );

  useEffect(() => {
    setLoadedIndices(new Set(Array.from({ length: Math.min(totalCards, MAX_VISIBLE) }, (_, index) => index)));
    setCenterIndex(needsPagination ? HALF : Math.floor(totalCards / 2));
    hasEntered.current = false;
    prevVisible.current = new Set();
  }, [totalCards, needsPagination]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isInView) return undefined;
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [isInView]);

  const getVisibleMap = useCallback(
    (center) => {
      const map = new Map();
      if (!needsPagination) {
        const middleSlot = Math.floor(totalCards / 2);
        for (let slot = 0; slot < totalCards; slot++) {
          const cardIndex = (center + slot - middleSlot + totalCards) % totalCards;
          map.set(cardIndex, slot);
        }
        return map;
      }
      for (let slot = 0; slot < MAX_VISIBLE; slot++) {
        map.set(
          ((center + slot - HALF) % totalCards + totalCards) % totalCards,
          slot,
        );
      }
      return map;
    },
    [totalCards, needsPagination, cards],
  );

  const cycle = useCallback(
    (direction) => {
      if (isAnimating.current || totalCards <= 1) return;
      isAnimating.current = true;
      directionRef.current = direction;
      const nextCenter =
        direction === "right"
          ? (centerIndex + 1) % totalCards
          : (centerIndex - 1 + totalCards) % totalCards;
      setLoadedIndices((previous) => {
        const next = new Set(previous);
        getVisibleMap(nextCenter).forEach((_, index) => next.add(index));
        return next;
      });
      setCenterIndex(nextCenter);
    },
    [centerIndex, totalCards, needsPagination, getVisibleMap],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards || !isInView) return;

    const cardElements = Array.from(
      container.querySelectorAll(".fan-card"),
    );
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot) => getSlotConfig(slotCount, slot);

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, target);
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          gsap.set(card, {
            x: `${enterX}rem`,
            y: `${y * hMult}rem`,
            rotation: direction === "right" ? 30 : -30,
            scale: 0.5,
            opacity: 0,
            visibility: "visible",
            pointerEvents: "auto",
          });
          gsap.to(card, {
            ...target,
            duration: reduceMotion ? 0 : 0.6,
            ease: "power2.out",
            onComplete: onCardDone,
          });
        } else {
          gsap.to(card, {
            ...target,
            duration: reduceMotion ? 0 : 0.5,
            ease: "power2.out",
            onComplete: onCardDone,
          });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -40 : 40;
        gsap.to(card, {
          x: `${exitX}rem`,
          opacity: 0,
          scale: 0.5,
          rotation: direction === "right" ? -30 : 30,
          duration: reduceMotion ? 0 : 0.4,
          ease: "power2.in",
          zIndex: 0,
          onComplete: () => gsap.set(card, { visibility: "hidden", pointerEvents: "none" }),
        });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0, visibility: "hidden", pointerEvents: "none" });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());
    if (isFirstMount) hasEntered.current = true;

    /* ── Hover interactions ── */
    const visibleEntries = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot = null;
    let leaveTimer = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot) => {
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          const isDesktop = window.innerWidth >= 1024;

          if (slot === hoveredSlot) {
            targetY -= (isDesktop ? 1.8 : 2.5) * hM;
            targetScale *= isDesktop ? 1.05 : 1.08;
          } else {
            let push;
            let rotAdjust;

            if (isDesktop) {
              // Desktop: subtle, refined parting so cards don't scatter off-screen
              push = Math.max(0.6, 3.2 / Math.pow(distance, 0.85));
              rotAdjust = 1.2 / (distance + 1);
            } else {
              // Mobile & Tablet: keep exact original calculation
              const normalized =
                centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
              const pushStrength =
                8 *
                (1 - Math.abs(normalized)) *
                (1 + 0.2 * Math.max(0, 3 - distance));
              push = pushStrength * mult;
              rotAdjust = 3 / (distance + 1);
            }

            if (slot < hoveredSlot) {
              targetX -= push;
              targetRot -= rotAdjust;
            } else {
              targetX += push;
              targetRot += rotAdjust;
            }

            if (
              slot === visibleEntries.length - 1 &&
              hoveredSlot < centerSlot
            )
              targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot)
              targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`,
          y: `${targetY}rem`,
          rotation: targetRot,
          scale: targetScale,
          duration: reduceMotion ? 0 : 0.5,
          delay: reduceMotion ? 0 : delay,
          ease: "elastic.out(1,.75)",
          overwrite: "auto",
        });
        gsap.set(el, { zIndex: slot === hoveredSlot ? 50 : base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating.current) return;
        if (leaveTimer) {
          clearTimeout(leaveTimer);
          leaveTimer = null;
        }
        if (activeSlot !== slot) {
          activeSlot = slot;
          updateHoverLayout(slot);
        }
      };
      el.addEventListener("mouseenter", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating.current) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        updateHoverLayout(null);
      }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      if (!isAnimating.current) updateHoverLayout(activeSlot);
    };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) =>
        el.removeEventListener("mouseenter", handler),
      );
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
      gsap.killTweensOf(cardElements);
    };
  }, [centerIndex, totalCards, getVisibleMap, needsPagination, isInView]);

  if (!totalCards) return null;

  return (
    <div className="gallery-fan">
      <div className="gallery-fan__stage" ref={containerRef}>
        {cards.map((card, index) => (
          <div className="fan-card" key={index}>
            <div className="fan-card__inner">
              {loadedIndices.has(index) && (
                <img
                  src={card.imgUrl}
                  loading="eager"
                  decoding="async"
                  alt={card.alt || `Galeri HIMANIKA ${index + 1}`}
                  className="fan-card__img"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {totalCards > 1 && (
        <div className="gallery-fan__nav">
          <button
            className="gallery-fan__arrow"
            onClick={() => cycle("left")}
            aria-label="Foto sebelumnya"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="gallery-fan__dots">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`gallery-fan__dot${i === centerIndex ? " gallery-fan__dot--active" : ""}`}
              />
            ))}
          </div>

          <button
            className="gallery-fan__arrow"
            onClick={() => cycle("right")}
            aria-label="Foto berikutnya"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
