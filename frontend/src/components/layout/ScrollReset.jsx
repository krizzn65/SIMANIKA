"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const frame = requestAnimationFrame(() => {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      });

      const timer = setTimeout(() => {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }, 80);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }

    // Links such as /#gallery: land on that section, re-aligning once late
    // content (images, API sections) has settled above it.
    const target = () => document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    const align = () => target()?.scrollIntoView({ block: "start", behavior: "instant" });
    const frame = requestAnimationFrame(align);
    const timer = setTimeout(align, 400);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
