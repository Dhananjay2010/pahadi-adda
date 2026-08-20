"use client";

import { HERO_PHOTOS } from "@/lib/heroPhotos";

export default function PhotoCredits({ onClose }: { onClose: () => void }) {
  return (
    <div className="credits-panel" role="dialog" aria-label="फोटो साभार">
      <div className="chat-header">
        <span>फोटो साभार</span>
        <button className="chat-close" onClick={onClose} aria-label="बंद करें">
          ✕
        </button>
      </div>
      <div className="credits-list">
        {HERO_PHOTOS.map((photo) => (
          <div className="credits-item" key={photo.id}>
            <a href={photo.credit.source} target="_blank" rel="noopener noreferrer">
              {photo.credit.title}
            </a>
            <div className="credits-meta">
              {photo.credit.author} &middot; {photo.credit.license} &middot; Wikimedia Commons
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
