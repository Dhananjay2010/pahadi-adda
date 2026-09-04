"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchGeo, placeLabel } from "@/lib/geo";

const ROOM = "pahadi-adda-room";

type PresenceMeta = {
  city: string | null;
  country: string | null;
  online_at: string;
};

export type JoinEvent = {
  key: string;
  label: string;
  at: number;
};

export type ReactionEvent = {
  id: string;
  emoji: string;
  x: number;
};

type ReactionPayload = { emoji: string; x: number };

/**
 * Tracks this browser tab as "present" in the shared room via Supabase
 * Realtime Presence, and surfaces the live headcount plus a stream of
 * join events (for toast notifications) to other tabs. Returns
 * onlineCount: null when Supabase isn't configured yet (see
 * .env.local.example) so callers can hide the live UI instead of showing a
 * fake number.
 */
export function usePresence() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [joinEvents, setJoinEvents] = useState<JoinEvent[]>([]);
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([]);
  const selfKeyRef = useRef<string>("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Presence's "join" event fires once per already-present member the
  // moment a client subscribes (the library diffs your empty starting state
  // against the full roster it receives) — not just for genuine new
  // arrivals. Those synthetic joins all land before the first "sync", so
  // gating on that tells real joins (after we have a baseline) apart from
  // "here's who was already here".
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    let sessionKey = sessionStorage.getItem("pahadi-adda-session");
    if (!sessionKey) {
      sessionKey = crypto.randomUUID();
      sessionStorage.setItem("pahadi-adda-session", sessionKey);
    }
    selfKeyRef.current = sessionKey;
    hasSyncedRef.current = false;

    const channel = supabase.channel(ROOM, {
      config: { presence: { key: sessionKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceMeta>();
        setOnlineCount(Object.keys(state).length);
        hasSyncedRef.current = true;
      })
      .on(
        "presence",
        { event: "join" },
        ({ key, newPresences }: { key: string; newPresences: PresenceMeta[] }) => {
          if (key === selfKeyRef.current) return;
          if (!hasSyncedRef.current) return;
          const meta = newPresences[0];
          const label = placeLabel({
            city: meta?.city ?? null,
            region: null,
            country: meta?.country ?? null,
          });
          setJoinEvents((prev) => [
            ...prev,
            { key: `${key}-${Date.now()}`, label, at: Date.now() },
          ]);
        },
      )
      .on(
        "broadcast",
        { event: "reaction" },
        ({ payload }: { payload: ReactionPayload }) => {
          setReactionEvents((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, emoji: payload.emoji, x: payload.x },
          ]);
        },
      )
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          const geo = await fetchGeo();
          await channel.track({
            city: geo.city,
            country: geo.country,
            online_at: new Date().toISOString(),
          } satisfies PresenceMeta);
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase!.removeChannel(channel);
    };
  }, []);

  // Sends a reaction to everyone else in the room and shows it locally too
  // (broadcast doesn't echo back to the sender by default).
  const sendReaction = useCallback((emoji: string) => {
    const x = Math.round((Math.random() - 0.5) * 120);
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: { emoji, x } });
    // Timestamp alone isn't unique: two taps inside the same millisecond
    // (an easy thing to do on a button people mash) collided on the React
    // key, and one of the two diyas was dropped instead of drawn.
    setReactionEvents((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}-self`, emoji, x },
    ]);
  }, []);

  const dismissReactionEvent = useCallback((id: string) => {
    setReactionEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Stable identity — Toast's auto-dismiss effect depends on this, and
  // PahadiAdda re-renders every ~500ms from the playback progress tick, so a
  // fresh function reference each render would keep re-triggering that
  // effect and reset the dismiss timer before it ever fires.
  const dismissJoinEvent = useCallback((key: string) => {
    setJoinEvents((prev) => prev.filter((e) => e.key !== key));
  }, []);

  return { onlineCount, joinEvents, dismissJoinEvent, reactionEvents, sendReaction, dismissReactionEvent };
}
