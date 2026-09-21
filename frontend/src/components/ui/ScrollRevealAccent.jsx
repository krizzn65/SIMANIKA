"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const COLOR_FROM = [247, 247, 245];
const COLOR_TO = [91, 156, 255];

function mixColor(progress) {
  return COLOR_FROM.map((channel, index) =>
    Math.round(channel + (COLOR_TO[index] - channel) * progress),
  );
}

export function ScrollRevealAccent({ text }) {
  const accentRef = useRef(null);
  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  useEffect(() => {
    const accent = accentRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!accent) return undefined;

    const characters = Array.from(
      accent.querySelectorAll("[data-accent-character]"),
    );
    const lastColorSteps = new Int16Array(characters.length).fill(-1);

    if (reducedMotion.matches) {
      characters.forEach((character) => {
        character.style.color = "rgb(91 156 255)";
      });
      return undefined;
    }

    let animationFrame = 0;
    let isVisible = false;
    let cachedTop = 0;
    let lastProgress = -1;

    const updateMetrics = () => {
      if (!accent) return;
      const bounds = accent.getBoundingClientRect();
      cachedTop = bounds.top + window.scrollY;
    };

    const paint = () => {
      if (!isVisible) {
        animationFrame = 0;
        return;
      }

      const viewportHeight = window.innerHeight || 1;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const relativeTop = cachedTop - scrollY;
      const revealStart = viewportHeight * 0.92;
      const revealEnd = viewportHeight * 0.48;
      const revealDistance = Math.max(revealStart - revealEnd, 1);
      const progress = clamp((revealStart - relativeTop) / revealDistance, 0, 1);

      if (
        (progress === 1 && lastProgress === 1) ||
        (progress === 0 && lastProgress === 0) ||
        (lastProgress !== -1 && Math.abs(progress - lastProgress) < 0.005)
      ) {
        animationFrame = 0;
        return;
      }
      lastProgress = progress;

      const characterProgress = progress * (characters.length + 0.8);

      characters.forEach((character, index) => {
        const localProgress = clamp(characterProgress - index, 0, 1);
        const colorStep = Math.round(localProgress * 64);
        if (colorStep === lastColorSteps[index]) return;
        lastColorSteps[index] = colorStep;
        const [red, green, blue] = mixColor(colorStep / 64);
        character.style.color = `rgb(${red} ${green} ${blue})`;
      });

      animationFrame = 0;
    };

    const schedulePaint = () => {
      if (!animationFrame && isVisible) {
        animationFrame = window.requestAnimationFrame(paint);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateMetrics();
          paint();
        }
      },
      { rootMargin: "150px 0px" },
    );
    observer.observe(accent);

    const handleResize = () => {
      updateMetrics();
      schedulePaint();
    };

    window.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      observer.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", handleResize);
    };
  }, [words]);

  return (
    <strong className="vision-reveal-accent" ref={accentRef} aria-label={text}>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={`${word}-${wordIndex}`}>
            <span className="vision-reveal-accent__word">
              {Array.from(word).map((character, characterIndex) => (
                <span
                  className="vision-reveal-accent__character"
                  data-accent-character
                  key={`${character}-${characterIndex}`}
                >
                  {character}
                </span>
              ))}
            </span>
            {" "}
          </Fragment>
        ))}
      </span>
    </strong>
  );
}
