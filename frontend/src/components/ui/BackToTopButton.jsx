"use client";

import { smoothScrollTo } from "@/components/motion/SmoothScroll";

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => smoothScrollTo(0)}
      className="site-footer__top-btn"
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="site-footer__top-icon"
        aria-hidden="true"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
      <span>TOP</span>
    </button>
  );
}
