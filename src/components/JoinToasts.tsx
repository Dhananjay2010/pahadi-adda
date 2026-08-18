"use client";

import { useEffect } from "react";
import type { JoinEvent } from "@/hooks/usePresence";

export default function JoinToasts({
  events,
  onDismiss,
}: {
  events: JoinEvent[];
  onDismiss: (key: string) => void;
}) {
  return (
    <div className="toast-stack" aria-live="polite">
      {events.map((e) => (
        <Toast key={e.key} event={e} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  event,
  onDismiss,
}: {
  event: JoinEvent;
  onDismiss: (key: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(event.key), 5000);
    return () => clearTimeout(t);
  }, [event.key, onDismiss]);

  return (
    <div className="toast">
      <span className="toast-dot" />
      <span>
        <b>{event.label}</b> से कोई अड्डे पर आया 👋
      </span>
    </div>
  );
}
