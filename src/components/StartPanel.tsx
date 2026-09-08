"use client";

/**
 * What a first-time visitor sees before sound is switched on.
 *
 * Browsers only allow autoplay while muted, so *some* click is unavoidable —
 * that click used to land on a near-opaque slab dropped over the player,
 * which hid the one thing that would make anyone want to press it (the song,
 * the artist, the fact that other people are already here) and left the
 * card's controls showing faintly through it like a broken screen.
 *
 * So the ask moved up here, into a panel of its own, alongside who's in the
 * room right now and what is about to play. The card below stays fully
 * visible and simply isn't live yet.
 */
export default function StartPanel({
  onlineCount,
  trackName,
  pending,
  onStart,
}: {
  onlineCount: number | null;
  trackName: string;
  pending: boolean;
  onStart: () => void;
}) {
  return (
    <div className="start-panel">
      <div className="start-panel-glow" aria-hidden="true" />
      <div className="start-panel-body">
        <h2 className="start-panel-title">पहाड़ी अड्डे में आपका स्वागत है</h2>
        <button
          className="start-panel-cta"
          onClick={onStart}
          disabled={pending}
          data-tip="चलाना शुरू करें (Space)"
        >
          {pending ? "जुड़ रहे हैं…" : "सुनना शुरू करें"}
        </button>
        <div className="start-panel-foot">
          {onlineCount !== null && onlineCount > 0 && (
            <span className="start-panel-live">
              <span className="dot" />
              अभी <b>{onlineCount}</b> लोग सुन रहे हैं
            </span>
          )}
          <span className="start-panel-track" title={trackName}>
            चल रहा है: <b>{trackName}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
