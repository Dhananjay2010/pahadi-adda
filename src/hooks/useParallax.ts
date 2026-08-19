"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle depth effect: the scene layers drift a few px opposite the
 * pointer, like a parallax photo. Mutates the DOM node directly via a ref
 * instead of React state so mousemove doesn't trigger re-renders.
 */
export function useParallax<T extends HTMLElement>(strength = 14) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // touch devices

    function handleMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * strength;
      const y = (e.clientY / window.innerHeight - 0.5) * strength;
      if (el) el.style.transform = `translate(${-x}px, ${-y}px)`;
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [strength]);

  return ref;
}
