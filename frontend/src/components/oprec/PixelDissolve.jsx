"use client";

// Adapted for the OPREC poster from React Bits Pixel Transition:
// https://reactbits.dev/animations/pixel-transition
import { useEffect, useRef } from "react";
import gsap from "gsap";

const columns = 12;
const rows = 8;
const cells = Array.from({ length: columns * rows }, (_, index) => index);
const order = [...cells].sort((a, b) => ((a * 37 + 17) % 97) - ((b * 37 + 17) % 97));
const opacity = (index) => index % 7 === 0 ? .88 : index % 3 === 0 ? .52 : .18;

export function PixelDissolve({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    const elements = Array.from(ref.current?.children || []);
    if (!elements.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(elements);
    if (reduce) { elements.forEach((element, index) => { element.style.opacity = active ? "0" : String(opacity(index)); }); return; }
    gsap.to(order.map((index) => elements[index]), {
      opacity: (position) => active ? 0 : opacity(order[position]),
      duration: .34,
      stagger: .018,
      ease: "power2.out",
      overwrite: true,
    });
    return () => gsap.killTweensOf(elements);
  }, [active]);
  return <div className="oprec-pixel-dissolve" ref={ref} aria-hidden="true">{cells.map((index) => <span key={index} style={{ opacity: opacity(index) }} />)}</div>;
}
