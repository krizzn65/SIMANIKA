"use client";

import { useEffect } from "react";

export function MotionVisibility() {
  useEffect(() => {
    const sections = document.querySelectorAll(".site-main-content > section");

    if (!("IntersectionObserver" in window)) {
      sections.forEach((section) => {
        section.dataset.motionActive = "true";
      });
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.dataset.motionActive = String(entry.isIntersecting);
        });
      },
      { rootMargin: "100px 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
