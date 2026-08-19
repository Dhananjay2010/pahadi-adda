"use client";

import { useTimeOfDay } from "@/hooks/useTimeOfDay";

type Position = { isDay: boolean; xPct: number; yPct: number };

/** Where the sun/moon sits along its arc right now, from local wall-clock time. */
function computePosition(hour: number): Position {
  const isDay = hour >= 6 && hour < 18;
  const segmentStart = isDay ? 6 : 18;
  const t = (((hour - segmentStart + 24) % 24) / 12); // 0..1 across sunrise/sunset -> sunrise/sunset
  const xPct = 8 + t * 84;
  const yPct = 56 - Math.sin(t * Math.PI) * 40;
  return { isDay, xPct, yPct };
}

/**
 * A sun or moon that drifts along a low arc matching the real time of day —
 * a passive, always-visible cue that time is actually passing, distinct
 * from any one scene's own baked-in artwork. Position updates every minute;
 * the gentle bob/glow keeps it visibly alive between those updates too.
 */
export default function CelestialBody() {
  const hour = useTimeOfDay();
  const pos = computePosition(hour);

  return (
    <div
      className="celestial"
      style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%` }}
      aria-hidden="true"
    >
      {pos.isDay ? (
        <svg className="celestial-sun" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="28" fill="url(#sun-glow)" />
          <circle cx="30" cy="30" r="11" fill="#fff3d6" />
        </svg>
      ) : (
        <svg className="celestial-moon" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="22" fill="url(#moon-glow)" />
          <circle cx="30" cy="28" r="11" fill="#f5ecd9" />
          <circle cx="35" cy="24" r="9.5" fill="#0e1530" />
        </svg>
      )}
      <svg width="0" height="0">
        <defs>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffcf7a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffcf7a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5ecd9" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f5ecd9" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
