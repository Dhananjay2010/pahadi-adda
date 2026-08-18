"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const selfKeyRef = useRef<string>("");

  useEffect(() => {
    if (!supabase) return;

    let sessionKey = sessionStorage.getItem("pahadi-adda-session");
    if (!sessionKey) {
      sessionKey = crypto.randomUUID();
      sessionStorage.setItem("pahadi-adda-session", sessionKey);
    }
    selfKeyRef.current = sessionKey;

    const channel = supabase.channel(ROOM, {
      config: { presence: { key: sessionKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceMeta>();
        setOnlineCount(Object.keys(state).length);
      })
      .on(
        "presence",
        { event: "join" },
        ({ key, newPresences }: { key: string; newPresences: PresenceMeta[] }) => {
          if (key === selfKeyRef.current) return;
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

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  // Stable identity — Toast's auto-dismiss effect depends on this, and
  // PahadiAdda re-renders every ~500ms from the playback progress tick, so a
  // fresh function reference each render would keep re-triggering that
  // effect and reset the dismiss timer before it ever fires.
  const dismissJoinEvent = useCallback((key: string) => {
    setJoinEvents((prev) => prev.filter((e) => e.key !== key));
  }, []);

  return { onlineCount, joinEvents, dismissJoinEvent };
}
