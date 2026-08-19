"use client";

import { useEffect, useRef } from "react";

/**
 * Drives real multi-layer depth: sets --px/--py (roughly -1..1) on the
 * target element as the pointer moves, which the .depth-far/-mid/-near
 * CSS classes each multiply by their own distance so far things barely
 * move and near things move a lot — an actual parallax stack, not the
 * whole scene sliding as one flat plane. Mutates the DOM directly via a
 * ref instead of React state so mousemove doesn't trigger re-renders.
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // touch devices

    function handleMove(e: MouseEvent) {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      if (el) {
        el.style.setProperty("--px", (-px * 2).toFixed(3));
        el.style.setProperty("--py", (-py * 2).toFixed(3));
      }
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return ref;
}
