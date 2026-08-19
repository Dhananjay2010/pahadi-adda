"use client";

import { useEffect } from "react";
import type { ReactionEvent } from "@/hooks/usePresence";

export default function ReactionBursts({
  events,
  onDismiss,
}: {
  events: ReactionEvent[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="reaction-layer" aria-hidden="true">
      {events.map((e) => (
        <Reaction key={e.id} event={e} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Reaction({
  event,
  onDismiss,
}: {
  event: ReactionEvent;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(event.id), 2200);
    return () => clearTimeout(t);
  }, [event.id, onDismiss]);

  return (
    <span
      className="reaction-emoji"
      style={{ left: `calc(50% + ${event.x}px)` }}
    >
      {event.emoji}
    </span>
  );
}
