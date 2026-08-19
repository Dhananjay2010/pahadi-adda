"use client";

/**
 * Soft drifting haze near the horizon, shared across every scene instead of
 * hand-authored per illustration — reads as mist/fog regardless of the
 * scene's palette (screen-blended, low opacity) and is one of the biggest
 * cheap wins for "this feels like a still poster": nothing in the frame
 * used to move continuously across the whole width before this.
 */
export default function MistLayer() {
  return (
    <div className="mist-layer" aria-hidden="true">
      <div className="mist-bank mist-1" />
      <div className="mist-bank mist-2" />
      <div className="mist-bank mist-3" />
    </div>
  );
}
