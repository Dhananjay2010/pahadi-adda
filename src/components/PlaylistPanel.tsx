"use client";

import { PLAYLIST } from "@/lib/playlist";

export default function PlaylistPanel({
  currentIndex,
  onSelect,
  onClose,
}: {
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="playlist-panel">
      <div className="chat-header">
        <span>पूरी सूची</span>
        <button className="chat-close" onClick={onClose} aria-label="सूची बंद करें">
          ✕
        </button>
      </div>
      <div className="playlist-list">
        {PLAYLIST.map((track, index) => (
          <button
            key={track.id}
            className={`playlist-item${index === currentIndex ? " active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <span className="playlist-item-num">
              {index === currentIndex ? <PlayingIcon /> : index + 1}
            </span>
            <span className="playlist-item-text">
              <span className="playlist-item-dev">{track.dev}</span>
              <span className="playlist-item-lat">{track.lat}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
