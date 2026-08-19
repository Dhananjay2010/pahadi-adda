"use client";

import { useEffect, useRef, useState } from "react";

type Sparkle = { id: number; x: number; y: number };

let nextId = 0;

/** A little burst of light wherever someone taps the scene — makes the
 * background feel touchable instead of just decorative. Ignores clicks on
 * real controls (buttons/links/inputs) so it only fires on empty scenery. */
export default function ClickSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function handleClick(e: MouseEvent) {
      if (reducedMotionRef.current) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, .card, .chat-panel, .playlist-panel")) return;

      const id = nextId++;
      setSparkles((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== id));
      }, 700);
    }

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="sparkle-layer" aria-hidden="true">
      {sparkles.map((s) => (
        <span key={s.id} className="sparkle-burst" style={{ left: s.x, top: s.y }}>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className="sparkle-mote"
              style={{ "--angle": `${i * 60}deg` } as React.CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}
