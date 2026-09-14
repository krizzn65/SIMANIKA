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

    if (reducedMotion.matches) {
      characters.forEach((character) => {
        character.style.color = "rgb(91 156 255)";
      });
      return undefined;
    }

    let animationFrame = 0;

    const paint = () => {
      const bounds = accent.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const revealStart = viewportHeight * 0.92;
      const revealEnd = viewportHeight * 0.48;
      const revealDistance = revealStart - revealEnd;
      const progress = clamp((revealStart - bounds.top) / revealDistance, 0, 1);
      const characterProgress = progress * (characters.length + 0.8);

      characters.forEach((character, index) => {
        const localProgress = clamp(characterProgress - index, 0, 1);
        const [red, green, blue] = mixColor(localProgress);
        character.style.color = `rgb(${red} ${green} ${blue})`;
      });

      animationFrame = 0;
    };

    const schedulePaint = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(paint);
    };

    schedulePaint();
    window.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", schedulePaint);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", schedulePaint);
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
