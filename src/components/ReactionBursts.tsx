"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { ReactionEvent } from "@/hooks/usePresence";

export default function ReactionBursts({
  events,
  originRef,
  onDismiss,
}: {
  events: ReactionEvent[];
  /** The diya button — every burst floats up out of it. */
  originRef: RefObject<HTMLElement | null>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="reaction-layer" aria-hidden="true">
      {events.map((e) => (
        <Reaction key={e.id} event={e} originRef={originRef} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Reaction({
  event,
  originRef,
  onDismiss,
}: {
  event: ReactionEvent;
  originRef: RefObject<HTMLElement | null>;
  onDismiss: (id: string) => void;
}) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const t = setTimeout(() => onDismiss(event.id), 2200);
    return () => clearTimeout(t);
  }, [event.id, onDismiss]);

  // Pin this diya to the button's position as it appears. Reactions from
  // other people carry only a horizontal jitter — their screen layout says
  // nothing about ours — so everyone's diya floats up out of the button
  // here, which is the thing that just got pressed. The style below is the
  // fallback for when the button isn't mounted yet.
  useLayoutEffect(() => {
    const el = elRef.current;
    const origin = originRef.current?.getBoundingClientRect();
    if (!el || !origin) return;
    // The jitter is ±60px, which can reach past the edge when the button
    // sits near one (a narrow phone), so keep it on screen.
    const x = origin.left + origin.width / 2 + event.x;
    el.style.left = `${Math.min(Math.max(x, 24), window.innerWidth - 24)}px`;
    el.style.top = `${origin.top}px`;
    el.style.bottom = "auto";
  }, [event.x, originRef]);

  return (
    <span
      ref={elRef}
      className="reaction-emoji"
      style={{ left: `calc(50% + ${event.x}px)`, bottom: "200px" }}
    >
      {event.emoji}
    </span>
  );
}
