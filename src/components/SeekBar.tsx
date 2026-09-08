"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

/**
 * The progress bar, as a real slider rather than a 4px `<div onClick>`.
 *
 * Three things the old one couldn't do, all of which people actually try:
 * drag the position instead of clicking once and hoping, hit it at all with
 * a thumb (the visible track stays thin, but the *hit area* is 18px tall and
 * spans the card), and reach it from the keyboard — it now takes focus and
 * answers the arrow keys like any other slider.
 *
 * Hovering shows the time under the pointer, because "where in the song does
 * this land" is the only question a click on a progress bar is ever asking.
 *
 * `data-owns-keys` tells the page-level shortcut handler in PahadiAdda to
 * keep its hands off the arrow keys while this has focus, so a focused
 * slider doesn't seek twice per press.
 */
export default function SeekBar({
  elapsed,
  duration,
  onSeek,
  disabled = false,
}: {
  elapsed: number;
  duration: number;
  /** Absolute position, in seconds. */
  onSeek: (seconds: number) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Where the pointer is hovering, as a fraction — drives the time preview.
  const [hover, setHover] = useState<number | null>(null);
  // While dragging, the bar shows where the *finger* is, not where playback
  // is: the player only learns the new position when the drag ends, and a
  // bar that snapped back to the old time on every move would be unusable.
  const [drag, setDrag] = useState<number | null>(null);

  const fractionFrom = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  const commit = useCallback(
    (fraction: number) => {
      if (duration > 0) onSeek(fraction * duration);
    },
    [duration, onSeek],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const fraction = fractionFrom(e.clientX);
      setDrag(fraction);
      setHover(fraction);
    },
    [disabled, fractionFrom],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const fraction = fractionFrom(e.clientX);
      setHover(fraction);
      if (drag !== null) setDrag(fraction);
    },
    [disabled, drag, fractionFrom],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag === null) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      commit(drag);
      setDrag(null);
      // A touch "hover" is really just the finger that has now lifted.
      if (e.pointerType !== "mouse") setHover(null);
    },
    [commit, drag],
  );

  // Losing the pointer mid-drag (a tab switch, the browser stealing capture)
  // must not leave the bar stuck showing a position playback never went to.
  useEffect(() => {
    if (drag === null) return;
    const cancel = () => setDrag(null);
    window.addEventListener("pointercancel", cancel);
    return () => window.removeEventListener("pointercancel", cancel);
  }, [drag]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || duration <= 0) return;
      const step =
        e.key === "PageUp" || e.key === "PageDown"
          ? 30
          : e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown"
            ? 5
            : 0;
      let next: number | null = null;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = duration;
      else if (step && (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp")) {
        next = Math.min(duration, elapsed + step);
      } else if (step && (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "PageDown")) {
        next = Math.max(0, elapsed - step);
      }
      if (next === null) return;
      e.preventDefault();
      onSeek(next);
    },
    [disabled, duration, elapsed, onSeek],
  );

  const playedFraction = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0;
  const shown = drag ?? playedFraction;
  const previewAt = hover ?? drag;

  return (
    <div
      ref={trackRef}
      className={`seek${drag !== null ? " dragging" : ""}${disabled ? " is-disabled" : ""}`}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="गीत में कहीं भी जाएं"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(drag !== null ? drag * duration : elapsed)}
      aria-valuetext={`${fmt(drag !== null ? drag * duration : elapsed)} / ${fmt(duration)}`}
      aria-disabled={disabled || undefined}
      data-owns-keys=""
      data-tip="खींचकर या क्लिक करके कहीं भी जाएं"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={() => {
        if (drag === null) setHover(null);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="seek-track">
        <div className="seek-fill" style={{ width: `${shown * 100}%` }} />
        <div className="seek-thumb" style={{ left: `${shown * 100}%` }} />
      </div>
      {previewAt !== null && duration > 0 && (
        <div className="seek-preview" style={{ left: `${previewAt * 100}%` }} aria-hidden="true">
          {fmt(previewAt * duration)}
        </div>
      )}
    </div>
  );
}
