"use client";

import { useEffect, useState } from "react";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

type Streak = { id: number; top: number; left: number };

let nextId = 0;

/** A rare, brief streak across the night sky — only between dusk and dawn. */
export default function ShootingStar() {
  const hour = useTimeOfDay();
  const isNight = hour >= 20 || hour < 5;
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (!isNight) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 14_000 + Math.random() * 26_000;
      timeout = setTimeout(() => {
        setStreak({
          id: nextId++,
          top: 6 + Math.random() * 22,
          left: 10 + Math.random() * 55,
        });
        setTimeout(() => setStreak(null), 1200);
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timeout);
  }, [isNight]);

  if (!isNight || !streak) return null;

  return (
    <div
      key={streak.id}
      className="shooting-star"
      style={{ top: `${streak.top}%`, left: `${streak.left}%` }}
      aria-hidden="true"
    />
  );
}
