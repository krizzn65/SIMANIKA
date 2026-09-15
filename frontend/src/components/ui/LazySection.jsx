"use client";

import { useEffect, useRef, useState } from "react";

export function LazySection({
  children,
  rootMargin = "250px 0px",
  minHeight = "40rem",
  className = "",
  id,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div
      id={id}
      ref={containerRef}
      className={className}
      style={!isVisible ? { minHeight } : undefined}
    >
      {isVisible ? children : null}
    </div>
  );
}
