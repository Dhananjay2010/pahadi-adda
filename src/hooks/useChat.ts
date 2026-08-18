"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchGeo, placeLabel } from "@/lib/geo";

const TABLE = "messages";
const HISTORY_LIMIT = 50;
const MAX_LENGTH = 300;
const SEND_COOLDOWN_MS = 2000;
const NICKNAME_KEY = "pahadi-adda-nickname";

export type ChatMessage = {
  id: number;
  created_at: string;
  author: string;
  place: string | null;
  content: string;
};

function randomNickname(): string {
  return `पहाड़ी_${Math.floor(100 + Math.random() * 900)}`;
}

export function readNickname(): string {
  const stored = localStorage.getItem(NICKNAME_KEY);
  return stored && stored.trim() ? stored : randomNickname();
}

export function saveNickname(name: string): void {
  localStorage.setItem(NICKNAME_KEY, name.slice(0, 30));
}

/**
 * Backed by a `messages` table in Supabase (see supabase/schema.sql) —
 * loads recent history once, then appends anything inserted afterward via
 * Realtime. Returns canSend: false while Supabase isn't configured, or
 * during the brief post-send cooldown.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const placeRef = useRef<string>("");

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    (async () => {
      const { data } = await supabase!
        .from(TABLE)
        .select("id, created_at, author, place, content")
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);
      if (!cancelled && data) {
        setMessages([...data].reverse());
        setLoaded(true);
      }
    })();

    fetchGeo().then((geo) => {
      placeRef.current = placeLabel(geo);
    });

    const channel = supabase
      .channel("pahadi-adda-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE },
        (payload: { new: ChatMessage }) => {
          setMessages((prev) => [...prev, payload.new].slice(-HISTORY_LIMIT));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, []);

  const sendMessage = useCallback(async (content: string, author: string) => {
    if (!supabase) return;
    const trimmed = content.trim().slice(0, MAX_LENGTH);
    if (!trimmed) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), SEND_COOLDOWN_MS);

    await supabase.from(TABLE).insert({
      author: author.trim().slice(0, 30) || "पहाड़ी",
      place: placeRef.current || null,
      content: trimmed,
    });
  }, []);

  return {
    messages,
    loaded,
    canSend: !!supabase && !cooldown,
    configured: !!supabase,
    sendMessage,
  };
}
