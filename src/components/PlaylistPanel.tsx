"use client";

import { useEffect, useRef } from "react";
import { PLAYLIST } from "@/lib/playlist";
import { useSongRequests } from "@/hooks/useSongRequests";

export default function PlaylistPanel({
  currentIndex,
  onSelect,
  onClose,
}: {
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const { configured, counts, hasVoted, requestSong } = useSongRequests();
  const activeRef = useRef<HTMLDivElement | null>(null);
  const opened = useRef(false);

  // Open on whatever is playing rather than at the top of a ~90-song list:
  // jump straight there when the panel opens, then follow along (gently) if
  // the track changes while it's still open.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "center",
      behavior: opened.current ? "smooth" : "auto",
    });
    opened.current = true;
  }, [currentIndex]);

  return (
    <div className="playlist-panel">
      <div className="chat-header">
        <span>पूरी सूची</span>
        <button
          className="chat-close"
          onClick={onClose}
          title="सूची बंद करें"
          aria-label="सूची बंद करें"
        >
          ✕
        </button>
      </div>
      <div className="playlist-list">
        {PLAYLIST.map((track, index) => {
          const voted = hasVoted(track.videoId);
          const count = counts[track.videoId] ?? 0;
          return (
            <div
              key={track.id}
              ref={index === currentIndex ? activeRef : undefined}
              className={`playlist-item${index === currentIndex ? " active" : ""}`}
            >
              <button
                className="playlist-item-select"
                onClick={() => onSelect(index)}
                title={`${track.dev} चलाएं`}
              >
                <span className="playlist-item-num">
                  {index === currentIndex ? <PlayingIcon /> : index + 1}
                </span>
                <span className="playlist-item-text">
                  <span className="playlist-item-dev">{track.dev}</span>
                  <span className="playlist-item-lat">
                    <span className="playlist-item-name">{track.lat}</span>
                    <span className="playlist-item-views">
                      {formatViews(track.views)} व्यू
                    </span>
                  </span>
                </span>
              </button>
              {configured && (
                <button
                  className={`playlist-item-request${voted ? " voted" : ""}`}
                  onClick={() => requestSong(track.videoId)}
                  disabled={voted}
                  title={voted ? "आपने अनुरोध कर दिया" : "यह गीत अनुरोध करें"}
                  aria-label={voted ? "आपने अनुरोध कर दिया" : "यह गीत अनुरोध करें"}
                >
                  <RequestIcon />
                  {count > 0 && <span>{count}</span>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** YouTube view counts in the Indian करोड़/लाख/हज़ार scale. */
function formatViews(views: number) {
  if (views >= 1e7) return `${(views / 1e7).toFixed(1)} करोड़`;
  if (views >= 1e5) return `${(views / 1e5).toFixed(1)} लाख`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)} हज़ार`;
  return `${views}`;
}

function PlayingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function RequestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 9.5 9H2l6 4.5L5.5 21 12 16l6.5 5-2.5-7.5L22 9h-7.5z" />
    </svg>
  );
}
