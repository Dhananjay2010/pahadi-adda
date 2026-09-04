"use client";

import { useEffect, useRef, useState } from "react";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { getTimePalette } from "@/lib/timePalette";
import { HERO_MEDIA, closestMediaIndex, type HeroMedia } from "@/lib/heroPhotos";

// How long each photo holds before the next one crossfades in. The Ken Burns
// zoom on each <img> runs on its own much longer, looping timer (see the
// .photo-layer img rule in globals.css) so it's never seen to "reset" —
// whichever photo becomes active is simply already mid-breath.
const HOLD_MS = 9000;

// Varying each layer's zoom transform-origin (instead of writing nearly
// identical keyframes per layer) is what makes the shared kenburns animation
// read as a different pan per layer rather than the same zoom repeated.
const ORIGINS = ["22% 30%", "78% 38%", "50% 74%", "30% 80%", "72% 22%", "42% 60%"];

export default function PhotoHero() {
  const hour = useTimeOfDay();
  const { skyGradient, nightAlpha, glowAlpha } = getTimePalette(hour);
  const [index, setIndex] = useState(() => closestMediaIndex(hour));
  const indexRef = useRef(index);
  // Which layers have had their file asked for. All twelve used to be
  // requested at once — nine full-size photographs and three videos on
  // preload="auto", about 4.5MB — to show one of them, on a site whose
  // audience is largely on a phone on Indian mobile data. Each one holds
  // for nine seconds, so the one on screen and the one after it is all
  // anybody can possibly need loaded.
  const [primed, setPrimed] = useState<Set<number>>(
    () => new Set([index, (index + 1) % HERO_MEDIA.length]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % HERO_MEDIA.length;
      indexRef.current = next;
      setIndex(next);
      setPrimed((current) => {
        const upcoming = (next + 1) % HERO_MEDIA.length;
        if (current.has(upcoming)) return current;
        const grown = new Set(current);
        grown.add(upcoming);
        return grown;
      });
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
        {HERO_MEDIA.map((media, i) => (
          <HeroLayer
            key={media.id}
            media={media}
            active={i === index}
            primed={primed.has(i)}
            origin={ORIGINS[i % ORIGINS.length]}
          />
        ))}
      </div>
      <div className="hero-color-wash" style={{ background: skyGradient }} aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <StarField />
      <div className="hero-vignette" aria-hidden="true" />
    </div>
  );
}

function HeroLayer({
  media,
  active,
  primed,
  origin,
}: {
  media: HeroMedia;
  active: boolean;
  /** False until this layer's turn is close enough to be worth downloading. */
  primed: boolean;
  origin: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Only the active layer actually plays — the rest sit paused on their
  // poster/first frame so cycling through 8 layers doesn't mean decoding
  // multiple videos at once. Reduced-motion users get the still poster only.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  // An un-primed layer is an empty div: it still holds its place in the
  // crossfade stack, it just hasn't fetched anything yet.
  return (
    <div className={`photo-layer${active ? " active" : ""}`}>
      {!primed ? null : media.type === "video" ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          style={{ transformOrigin: origin }}
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <img
          src={media.src}
          alt=""
          decoding="async"
          fetchPriority={active ? "high" : "low"}
          style={{ transformOrigin: origin }}
        />
      )}
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
