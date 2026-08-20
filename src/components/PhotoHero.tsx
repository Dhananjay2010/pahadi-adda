"use client";

import { useEffect, useRef, useState } from "react";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { getTimePalette } from "@/lib/timePalette";
import { HERO_PHOTOS, closestPhotoIndex } from "@/lib/heroPhotos";

// How long each photo holds before the next one crossfades in. The Ken Burns
// zoom on each <img> runs on its own much longer, looping timer (see the
// .photo-layer img rule in globals.css) so it's never seen to "reset" —
// whichever photo becomes active is simply already mid-breath.
const HOLD_MS = 9000;

// Varying each photo's zoom transform-origin (instead of writing five nearly
// identical keyframes) is what makes the shared kenburns animation read as a
// different pan per photo rather than the same zoom repeated six times.
const ORIGINS = ["22% 30%", "78% 38%", "50% 74%", "30% 80%", "72% 22%", "42% 60%"];

export default function PhotoHero() {
  const hour = useTimeOfDay();
  const { skyGradient, nightAlpha, glowAlpha } = getTimePalette(hour);
  const [index, setIndex] = useState(() => closestPhotoIndex(hour));
  const indexRef = useRef(index);

  useEffect(() => {
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % HERO_PHOTOS.length;
      setIndex(indexRef.current);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="hero-scene stage photo-hero"
      style={
        {
          "--night": nightAlpha,
          "--glow": glowAlpha,
        } as React.CSSProperties
      }
    >
      <div className="photo-stack depth-mid" aria-hidden="true">
        {HERO_PHOTOS.map((photo, i) => (
          <div key={photo.id} className={`photo-layer${i === index ? " active" : ""}`}>
            <img src={photo.src} alt="" style={{ transformOrigin: ORIGINS[i % ORIGINS.length] }} />
          </div>
        ))}
      </div>
      <div className="hero-color-wash" style={{ background: skyGradient }} aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <StarField />
      <div className="hero-vignette" aria-hidden="true" />
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 90 }, (_, i) => {
    const left = (i * 53.7) % 100;
    const top = (i * 29.3) % 62;
    const size = 0.7 + ((i * 7) % 5) * 0.25;
    const delay = (i * 0.37) % 4;
    return { left, top, size, delay };
  });

  return (
    <div className="hero-stars" aria-hidden="true">
      <div className="milky-way" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="star-dot"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
