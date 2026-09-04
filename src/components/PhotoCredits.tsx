"use client";

import { HERO_MEDIA } from "@/lib/heroPhotos";

export default function PhotoCredits({ onClose }: { onClose: () => void }) {
  return (
    <div className="credits-panel" role="dialog" aria-label="फोटो साभार">
      <div className="chat-header">
        <span>फोटो साभार</span>
        <button className="chat-close" onClick={onClose} title="बंद करें" aria-label="बंद करें">
          ✕
        </button>
      </div>
      <div className="credits-list">
        {HERO_MEDIA.map((media) => (
          <div className="credits-item" key={media.id}>
            <a
              href={media.credit.source}
              target="_blank"
              rel="noopener noreferrer"
              title={`${media.credit.platform} पर मूल फोटो देखें`}
            >
              {media.credit.title}
            </a>
            <div className="credits-meta">
              {media.credit.author} &middot; {media.credit.license} &middot; {media.credit.platform}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
