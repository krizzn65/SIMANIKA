"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const REVEAL_FROM = [132, 138, 150];
const REVEAL_TO = [10, 16, 32];

const mixColor = (progress) =>
  REVEAL_FROM.map((channel, index) =>
    Math.round(channel + (REVEAL_TO[index] - channel) * progress),
  );

export function ScrollRevealText({ id, lines }) {
  const headingRef = useRef(null);
  const wordLines = useMemo(
    () => lines.map((line) => line.trim().split(/\s+/)),
    [lines],
  );

  useEffect(() => {
    const heading = headingRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!heading) return undefined;

    const characters = Array.from(
      heading.querySelectorAll("[data-reveal-character]"),
    );

    if (reducedMotion.matches) {
      characters.forEach((character) => {
        character.style.color = "rgb(10 16 32)";
      });
      return undefined;
    }

    let isVisible = false;
    let animationFrame = 0;

    const paint = () => {
      if (!isVisible) {
        animationFrame = 0;
        return;
      }

      const bounds = heading.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const revealStart = viewportHeight * 0.88;
      const revealDistance = Math.max(viewportHeight * 0.62, bounds.height * 0.9);
      const progress = clamp((revealStart - bounds.top) / revealDistance, 0, 1);
      const characterProgress = progress * (characters.length + 0.75);

      characters.forEach((character, index) => {
        const localProgress = clamp(characterProgress - index, 0, 1);
        const [red, green, blue] = mixColor(localProgress);
        character.style.color = `rgb(${red} ${green} ${blue})`;
      });

      animationFrame = 0;
    };

    const schedulePaint = () => {
      if (!animationFrame && isVisible) {
        animationFrame = window.requestAnimationFrame(paint);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) paint();
    });
    observer.observe(heading);

    window.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", schedulePaint);

    return () => {
      observer.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", schedulePaint);
    };
  }, [wordLines]);

  return (
    <h2 ref={headingRef} id={id} aria-label={lines.join(" ")}>
      {wordLines.map((words, lineIndex) => (
        <span aria-hidden="true" className="scroll-reveal-line" key={lines[lineIndex]}>
          {words.map((word, wordIndex) => (
            <Fragment key={`${word}-${wordIndex}`}>
              <span className="scroll-reveal-word">
                {Array.from(word).map((character, characterIndex) => (
                  <span
                    className="scroll-reveal-character"
                    data-reveal-character
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
      ))}
    </h2>
  );
}
