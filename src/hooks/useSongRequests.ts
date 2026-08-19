"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TABLE = "song_requests";
const WINDOW_HOURS = 6;
const VOTED_KEY = "pahadi-adda-voted-songs";

function readVoted(): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVoted(voted: Set<string>): void {
  localStorage.setItem(VOTED_KEY, JSON.stringify([...voted]));
}

/**
 * Lightweight "nudge what plays next" signal, backed by `song_requests`
 * (see supabase/schema.sql) — every insert is one vote for a video_id.
 * Counts only look at the last WINDOW_HOURS so a song that was popular
 * yesterday doesn't sit permanently at the top; it never touches the
 * shared playback schedule itself, it's informational only.
 */
export function useSongRequests() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  // Safe to read localStorage in the initializer: this hook only ever runs
  // inside the ssr:false PahadiAdda tree, so there's no server render to
  // mismatch against (same reasoning as useChat's readNickname).
  const [voted, setVoted] = useState<Set<string>>(readVoted);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();

    (async () => {
      const { data } = await supabase!
        .from(TABLE)
        .select("video_id")
        .gte("created_at", since);
      if (cancelled || !data) return;
      const tally: Record<string, number> = {};
      for (const row of data as { video_id: string }[]) {
        tally[row.video_id] = (tally[row.video_id] ?? 0) + 1;
      }
      setCounts(tally);
    })();

    const channel = supabase
      .channel("pahadi-adda-song-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE },
        (payload: { new: { video_id: string } }) => {
          const videoId = payload.new.video_id;
          setCounts((prev) => ({ ...prev, [videoId]: (prev[videoId] ?? 0) + 1 }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, []);

  const requestSong = useCallback(
    async (videoId: string) => {
      if (!supabase || voted.has(videoId)) return;
      setVoted((prev) => {
        const next = new Set(prev).add(videoId);
        saveVoted(next);
        return next;
      });
      await supabase.from(TABLE).insert({ video_id: videoId });
    },
    [voted],
  );

  return {
    configured: !!supabase,
    counts,
    hasVoted: (videoId: string) => voted.has(videoId),
    requestSong,
  };
}
