"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const TAU = Math.PI * 2;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const easeInOut = (value) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

export function HaloReel({
  items,
  ariaLabel = "Galeri HIMANIKA",
  cardWidth = 154,
  cardHeight = 210,
  minScale = 0.42,
  radiusXRatio = 0.39,
  centerXRatio = 0.46,
  radiusYRatio = 0.35,
  frontSide = "right",
  holdDuration = 1500,
  stepDuration = 850,
  spread = 1.08,
}) {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const frameRef = useRef(0);
  const settleFrameRef = useRef(0);
  const rotationRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const settlingRef = useRef(false);
  const dragRef = useRef({ left: 0, top: 0, angle: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  const geometry = useMemo(() => {
    const count = items.length;
    const radiusX = size.width * radiusXRatio;
    const radiusY = size.height * radiusYRatio;
    const slots = count
      ? clamp(
          Math.ceil(
            TAU *
              Math.max(
                radiusX / (cardWidth * spread),
                radiusY / (cardHeight * spread),
              ),
          ),
          count,
          Math.max(count, 32),
        )
      : 0;
    const step = slots ? TAU / slots : 0;
    const fit = size.width
      ? clamp(
          Math.min(
            size.width / (radiusX + cardWidth),
            size.height / (2 * radiusY + cardHeight),
          ),
          0.54,
          1,
        )
      : 1;

    return {
      cardHeight: cardHeight * fit,
      cardWidth: cardWidth * fit,
      radiusX,
      radiusY,
      slots,
      step,
    };
  }, [
    cardHeight,
    cardWidth,
    items.length,
    radiusXRatio,
    radiusYRatio,
    size.height,
    size.width,
    spread,
  ]);

  const layoutCards = useCallback(
    (rotation) => {
      const {
        cardHeight: fittedHeight,
        cardWidth: fittedWidth,
        radiusX,
        radiusY,
        step,
      } = geometry;
      const centerX = size.width * centerXRatio;
      const centerY = size.height / 2;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;

        const angle = index * step + rotation;
        const horizontalPosition = Math.cos(angle);
        const depth = frontSide === "left" ? -horizontalPosition : horizontalPosition;
        const scale = minScale + (1 - minScale) * ((depth + 1) / 2);
        const x = centerX + radiusX * horizontalPosition - fittedWidth / 2;
        const y = centerY + radiusY * Math.sin(angle) - fittedHeight / 2;

        card.style.width = `${fittedWidth}px`;
        card.style.height = `${fittedHeight}px`;
        card.style.zIndex = `${Math.round(scale * 1000)}`;
        card.style.opacity = `${0.42 + scale * 0.58}`;
        card.style.filter = `saturate(${0.62 + scale * 0.38}) brightness(${0.72 + scale * 0.28})`;
        card.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      });
    },
    [centerXRatio, frontSide, geometry, minScale, size.height, size.width],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      setSize({ width: stage.offsetWidth, height: stage.offsetHeight });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(query.matches);

    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    layoutCards(rotationRef.current);
  }, [layoutCards]);

  useEffect(() => {
    if (!geometry.step || reduceMotion) return undefined;

    let previousTime = performance.now();
    let elapsed = 0;
    let phase = "hold";
    let stepStart = rotationRef.current;

    const animate = (time) => {
      const delta = Math.min(time - previousTime, 64);
      previousTime = time;

      if (!pausedRef.current && !draggingRef.current && !settlingRef.current) {
        elapsed += delta;

        if (phase === "hold" && elapsed >= holdDuration) {
          phase = "step";
          elapsed -= holdDuration;
          stepStart = rotationRef.current;
        }

        if (phase === "step") {
          const progress = clamp(elapsed / stepDuration, 0, 1);
          rotationRef.current =
            stepStart - geometry.step * easeInOut(progress);
          layoutCards(rotationRef.current);

          if (progress === 1) {
            phase = "hold";
            elapsed = 0;
          }
        }
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [geometry.step, holdDuration, layoutCards, reduceMotion, stepDuration]);

  useEffect(
    () => () => window.cancelAnimationFrame(settleFrameRef.current),
    [],
  );

  const settleTo = useCallback(
    (target) => {
      window.cancelAnimationFrame(settleFrameRef.current);

      if (reduceMotion) {
        rotationRef.current = target;
        layoutCards(target);
        return;
      }

      const start = rotationRef.current;
      const startedAt = performance.now();
      settlingRef.current = true;

      const animate = (time) => {
        const progress = clamp((time - startedAt) / 520, 0, 1);
        rotationRef.current = start + (target - start) * easeInOut(progress);
        layoutCards(rotationRef.current);

        if (progress < 1) {
          settleFrameRef.current = window.requestAnimationFrame(animate);
        } else {
          settlingRef.current = false;
        }
      };

      settleFrameRef.current = window.requestAnimationFrame(animate);
    },
    [layoutCards, reduceMotion],
  );

  const pointerAngle = (event) => {
    const { left, top } = dragRef.current;

    return Math.atan2(
      (event.clientY - top - size.height / 2) / (geometry.radiusY || 1),
      (event.clientX - left - size.width * centerXRatio) /
        (geometry.radiusX || 1),
    );
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    window.cancelAnimationFrame(settleFrameRef.current);
    settlingRef.current = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    dragRef.current = { left: bounds.left, top: bounds.top, angle: 0 };
    dragRef.current.angle = pointerAngle(event);
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return;

    const angle = pointerAngle(event);
    const delta =
      ((angle - dragRef.current.angle + Math.PI * 3) % TAU) - Math.PI;
    dragRef.current.angle = angle;
    rotationRef.current += delta;
    layoutCards(rotationRef.current);
  };

  const handlePointerEnd = (event) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const target =
      Math.round(rotationRef.current / geometry.step) * geometry.step;
    settleTo(target);
  };

  const handleKeyDown = (event) => {
    const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!direction || !geometry.step) return;

    event.preventDefault();
    const target =
      Math.round(rotationRef.current / geometry.step) * geometry.step -
      direction * geometry.step;
    settleTo(target);
  };

  if (!items.length) return null;

  return (
    <div
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className="halo-reel"
      onBlur={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={(event) => {
        pausedRef.current = false;
        handlePointerEnd(event);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      ref={stageRef}
      role="region"
      tabIndex={0}
    >
      {Array.from({ length: geometry.slots }, (_, index) => {
        const item = items[index % items.length];
        const decorative = index >= items.length;

        return (
          <figure
            aria-hidden={decorative || undefined}
            aria-label={decorative ? undefined : item.alt || item.title}
            aria-roledescription={decorative ? undefined : "slide"}
            className={`halo-reel__card halo-reel__card--${item.variant || "image"}`}
            key={index}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            role={decorative ? undefined : "group"}
          >
            {item.src ? (
              <img
                alt={decorative ? "" : item.alt || ""}
                draggable={false}
                height={cardHeight}
                loading="lazy"
                src={item.src}
                width={cardWidth}
              />
            ) : (
              <div className="halo-reel__text-face">
                <span>{item.eyebrow}</span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
