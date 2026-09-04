"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { YoutubeResult } from "@/app/api/youtube-search/route";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { PLAYLIST } from "@/lib/playlist";
import { searchPlaylist } from "@/lib/search";

/** Dictation only takes one language at a time, so it's a choice — and
 *  one worth remembering, since people tend to search the same way. */
const VOICE_LANGUAGES = [
  { code: "hi-IN", label: "हिंदी" },
  { code: "en-IN", label: "English" },
] as const;
const VOICE_LANGUAGE_KEY = "pahadi-adda-voice-lang";

type RemoteState = {
  query: string;
  status: "idle" | "loading" | "done" | "error";
  items: YoutubeResult[];
};

export default function PlaylistPanel({
  currentIndex,
  guestVideoId,
  onSelect,
  onPlayExternal,
  onClose,
}: {
  currentIndex: number;
  /** Set while something found on YouTube is playing instead of a track. */
  guestVideoId: string | null;
  onSelect: (index: number) => void;
  onPlayExternal: (result: YoutubeResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  // Read straight into the initial state rather than in an effect: this
  // panel is only ever mounted by a click, so there's no server render for
  // it to disagree with.
  const [voiceLang, setVoiceLang] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(VOICE_LANGUAGE_KEY);
      if (saved && VOICE_LANGUAGES.some((language) => language.code === saved)) return saved;
    } catch {
      // storage blocked — the default is fine
    }
    return VOICE_LANGUAGES[0].code;
  });
  const voice = useVoiceSearch(setQuery);
  const [remote, setRemote] = useState<RemoteState>({ query: "", status: "idle", items: [] });
  const activeRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const opened = useRef(false);

  const results = useMemo(() => searchPlaylist(query), [query]);
  const searching = query.trim().length >= 2;
  const nothingLocally = searching && results.length === 0;

  // Open on whatever is playing rather than at the top of a 95-song list:
  // jump straight there when the panel opens, then follow along (gently) if
  // the track changes while it's still open. Not while searching — there
  // the list should start at the best match.
  useEffect(() => {
    if (query) return;
    activeRef.current?.scrollIntoView({
      block: "center",
      behavior: opened.current ? "smooth" : "auto",
    });
    opened.current = true;
  }, [currentIndex, query]);

  // A new search starts at its best match, not wherever the list happened
  // to be scrolled to for the song that's playing.
  useEffect(() => {
    if (query) listRef.current?.scrollTo({ top: 0 });
  }, [query]);

  // Nothing in the list matches, so go and ask YouTube — debounced, since
  // this runs off typing, and only for queries the local list has already
  // failed to answer.
  useEffect(() => {
    if (!nothingLocally) return;
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: YoutubeResult[] };
        setRemote({
          query: q,
          status: response.ok ? "done" : "error",
          items: data.results ?? [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setRemote({ query: q, status: "error", items: [] });
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, nothingLocally]);

  // Results that belong to an older query are no longer an answer to what's
  // on screen; until the debounce and the request land, this is a search in
  // progress. Derived rather than reset in an effect, which would be an
  // extra render for no reason.
  const current: RemoteState =
    remote.query === query.trim() ? remote : { query: query.trim(), status: "loading", items: [] };

  return (
    <div className="playlist-panel">
      <div className="chat-header">
        <span>पूरी सूची</span>
        <button
          className="chat-close"
          onClick={onClose}
          data-tip="सूची बंद करें"
          aria-label="सूची बंद करें"
        >
          ✕
        </button>
      </div>

      <div className="playlist-search">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            if (query) setQuery("");
            else onClose();
          }}
          placeholder="गीत या कलाकार खोजें…"
          data-tip="हिंदी या अंग्रेज़ी, दोनों चलेंगे"
          aria-label="गीत खोजें"
        />
        {query && (
          <button
            className="playlist-search-clear"
            onClick={() => setQuery("")}
            data-tip="खोज हटाएं"
            aria-label="खोज हटाएं"
          >
            ✕
          </button>
        )}
        {voice.supported && (
          <button
            className={`playlist-search-mic${voice.status === "listening" ? " on" : ""}`}
            onClick={() => (voice.status === "listening" ? voice.stop() : voice.start(voiceLang))}
            data-tip={
              voice.status === "listening" ? "सुनना बंद करें" : "बोलकर खोजें"
            }
            aria-label={voice.status === "listening" ? "सुनना बंद करें" : "बोलकर खोजें"}
            aria-pressed={voice.status === "listening"}
          >
            <MicIcon />
          </button>
        )}
      </div>

      {voice.supported && voice.status !== "idle" && (
        <div className="playlist-voice">
          <span className={voice.status === "listening" ? "playlist-voice-live" : undefined}>
            {voice.status === "listening"
              ? voice.stage === "hearing"
                ? "सुन रहे हैं…"
                : voice.stage === "mic-open"
                  ? "माइक चालू है — अब बोलिए"
                  : "माइक शुरू हो रहा है…"
              : voice.status === "denied"
                ? "माइक की अनुमति नहीं मिली — ब्राउज़र सेटिंग में दें"
                : voice.status === "unheard"
                  ? "कुछ सुनाई नहीं दिया — फिर बोलिए"
                  : voice.problem === "no-mic"
                    ? "माइक से आवाज़ नहीं आ रही — दूसरा माइक चुनकर देखें"
                    : voice.code === "brave"
                      ? "Brave में आवाज़ पहचान बंद रहती है — Chrome या Safari में खोलें"
                      : "इस ब्राउज़र में आवाज़ पहचान नहीं चल रही — Chrome में खोलें"}
            {voice.status !== "listening" && voice.code && voice.code !== "brave"
              ? ` (${voice.code})`
              : ""}
          </span>
          {VOICE_LANGUAGES.map((language) => (
            <button
              key={language.code}
              className={`playlist-voice-lang${voiceLang === language.code ? " on" : ""}`}
              onClick={() => {
                setVoiceLang(language.code);
                try {
                  localStorage.setItem(VOICE_LANGUAGE_KEY, language.code);
                } catch {
                  // storage blocked — the choice just won't be remembered
                }
                voice.start(language.code);
              }}
              data-tip={`${language.label} में बोलिए`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}

      <div className="playlist-list" ref={listRef}>
        {results.map((track) => {
          const index = PLAYLIST.indexOf(track);
          const active = index === currentIndex && !guestVideoId;
          return (
            <div
              key={track.id}
              ref={index === currentIndex ? activeRef : undefined}
              className={`playlist-item${active ? " active" : ""}`}
            >
              <button
                className="playlist-item-select"
                onClick={() => onSelect(index)}
                data-tip={`${track.dev} चलाएं`}
              >
                <span className="playlist-item-num">
                  {active ? <PlayingIcon /> : index + 1}
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
            </div>
          );
        })}

        {nothingLocally && (
          <div className="playlist-remote">
            <div className="playlist-remote-head">
              {current.status === "loading"
                ? "YouTube पर खोज रहे हैं…"
                : current.status === "error"
                  ? "YouTube से जवाब नहीं मिला — थोड़ी देर में फिर कोशिश करें"
                  : current.items.length > 0
                    ? "हमारी सूची में नहीं है — YouTube पर मिला"
                    : "कुछ नहीं मिला"}
            </div>
            {current.items.map((item) => (
              <button
                key={item.videoId}
                className={`playlist-item playlist-remote-item${
                  guestVideoId === item.videoId ? " active" : ""
                }`}
                onClick={() => onPlayExternal(item)}
                data-tip={`${item.title} चलाएं`}
              >
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" loading="lazy" />
                ) : (
                  <span className="playlist-remote-thumb" />
                )}
                <span className="playlist-item-text">
                  <span className="playlist-item-dev">{item.title}</span>
                  <span className="playlist-item-lat">
                    <span className="playlist-item-name">{item.channel}</span>
                    <span className="playlist-item-views">
                      {item.duration ? formatTime(item.duration) : ""}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.92V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A6 6 0 0 0 18 11z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
