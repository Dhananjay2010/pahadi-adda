"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * One flat list of everything the arrow keys walk — the tracks that matched
 * locally, then any YouTube results shown underneath them. They are two
 * sections on screen but one list to somebody holding the down arrow, so
 * they share a single index.
 */
type Row =
  | { kind: "track"; index: number; label: string }
  | { kind: "remote"; item: YoutubeResult; label: string };

export default function PlaylistPanel({
  currentIndex,
  guestVideoId,
  autoFocusSearch = false,
  onSelect,
  onPlayExternal,
  onClose,
}: {
  currentIndex: number;
  /** Set while something found on YouTube is playing instead of a track. */
  guestVideoId: string | null;
  /** Opened by the "/" shortcut — put the caret in the box. Never on a tap. */
  autoFocusSearch?: boolean;
  onSelect: (index: number) => void;
  onPlayExternal: (result: YoutubeResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  // Which row the keyboard is pointing at, as an index into `rows` below.
  // -1 is "no pointer yet", which is how browsing the whole list starts:
  // highlighting song 1 of 95 while someone is looking at the one playing
  // in the middle of the list would be answering a question nobody asked.
  const [cursor, setCursor] = useState(-1);
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
  // Every route into the search box goes through here so the pointer can be
  // reset with it: a new search means the old highlight is pointing at a row
  // that may no longer exist, let alone still be the best answer. Typing
  // puts it on the top match, so Enter plays what you were looking for
  // without touching an arrow key at all.
  const applyQuery = useCallback((value: string) => {
    setQuery(value);
    setCursor(value.trim().length >= 2 ? 0 : -1);
  }, []);

  const voice = useVoiceSearch(applyQuery);
  const [remote, setRemote] = useState<RemoteState>({ query: "", status: "idle", items: [] });
  const activeRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const opened = useRef(false);

  const results = useMemo(() => searchPlaylist(query), [query]);
  const searching = query.trim().length >= 2;
  const nothingLocally = searching && results.length === 0;

  // Someone who opened this by typing "/" is mid-keystroke; put them in the
  // box. Someone who tapped the button wants to look at the list, and
  // focusing the input there would throw a keyboard over half of it.
  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

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

  const rows: Row[] = useMemo(() => {
    const local: Row[] = results.map((track) => ({
      kind: "track",
      index: PLAYLIST.indexOf(track),
      label: `${track.dev}, ${track.lat}`,
    }));
    if (!nothingLocally) return local;
    return [
      ...local,
      ...current.items.map<Row>((item) => ({
        kind: "remote",
        item,
        label: `${item.title}, ${item.channel}, YouTube`,
      })),
    ];
  }, [results, nothingLocally, current.items]);

  const cursorRow = cursor >= 0 && cursor < rows.length ? rows[cursor] : null;

  const play = useCallback(
    (row: Row) => {
      if (row.kind === "track") onSelect(row.index);
      else onPlayExternal(row.item);
    },
    [onSelect, onPlayExternal],
  );

  // Up/down walk the results and Enter plays the one under the pointer, so a
  // search that started with "/" can finish without reaching for the mouse.
  // The player's own up/down (volume) stands down while this panel is open —
  // see the keyboard handler in PahadiAdda.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || rows.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setCursor((at) => {
          if (at < 0) {
            // Nothing pointed at yet. Start from whatever is playing rather
            // than from the top of ninety-five rows — it is already the row
            // in view, so the list doesn't jump out from under anyone.
            const playing = rows.findIndex(
              (row) => row.kind === "track" && row.index === currentIndex,
            );
            return playing >= 0 ? playing : step > 0 ? 0 : rows.length - 1;
          }
          return (at + step + rows.length) % rows.length;
        });
        return;
      }

      if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        setCursor(e.key === "Home" ? 0 : rows.length - 1);
        return;
      }

      if (e.key === "Enter") {
        // A row (or the mic, or the clear button) that already has focus
        // gets to answer its own Enter — otherwise one press fires twice.
        if (e.target instanceof HTMLElement && e.target.closest("button, a")) return;
        // With a search typed, Enter means "the top match" even if the
        // arrows were never touched.
        const row = cursorRow ?? (searching ? rows[0] : null);
        if (!row) return;
        e.preventDefault();
        play(row);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rows, cursorRow, currentIndex, searching, play]);

  // Keep the pointed-at row on screen as it moves.
  useEffect(() => {
    if (cursor >= 0) cursorRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="playlist-panel">
      <div className="panel-header">
        <span>
          पूरी सूची
          {/* A count, because "95 songs" and "the 3 that matched" are very
              different things to be looking at, and the list itself only
              tells you by how far it scrolls. */}
          <span className="panel-header-count">
            {searching ? `${results.length} मिले` : `${PLAYLIST.length} गीत`}
          </span>
        </span>
        <button
          className="panel-close"
          onClick={onClose}
          data-tip="सूची बंद करें (Esc)"
          aria-label="सूची बंद करें"
        >
          ✕
        </button>
      </div>

      <div className="playlist-search">
        <SearchIcon />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => applyQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            if (query) applyQuery("");
            else onClose();
          }}
          placeholder="गीत या कलाकार खोजें…"
          data-tip="हिंदी या अंग्रेज़ी · ↑ ↓ से चुनें, Enter से चलाएं"
          aria-label="गीत खोजें"
        />
        {query && (
          <button
            className="playlist-search-clear"
            onClick={() => applyQuery("")}
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
        {results.map((track, position) => {
          const index = PLAYLIST.indexOf(track);
          const active = index === currentIndex && !guestVideoId;
          const pointed = cursor === position;
          return (
            <div
              key={track.id}
              ref={(node) => {
                if (index === currentIndex) activeRef.current = node;
                if (pointed) cursorRef.current = node;
              }}
              className={`playlist-item${active ? " active" : ""}${pointed ? " pointed" : ""}`}
            >
              <button
                className="playlist-item-select"
                onClick={() => onSelect(index)}
                data-tip={`${track.dev} चलाएं`}
                aria-current={active ? "true" : undefined}
              >
                <span className="playlist-item-num" aria-hidden="true">
                  {active ? <PlayingIcon /> : index + 1}
                </span>
                <span className="playlist-item-text">
                  <span className="playlist-item-dev">{track.dev}</span>
                  <span className="playlist-item-lat">
                    <span className="playlist-item-name" lang="en">
                      {track.lat}
                    </span>
                    <span className="playlist-item-views">
                      {formatViews(track.views)} व्यू
                    </span>
                  </span>
                </span>
                <span className="playlist-item-time">{formatTime(track.assumedDuration)}</span>
              </button>
            </div>
          );
        })}

        {!searching && results.length === 0 && (
          <div className="playlist-empty">कोई गीत नहीं मिला</div>
        )}

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
            {current.items.map((item, position) => {
              const pointed = cursor === results.length + position;
              return (
              <button
                key={item.videoId}
                ref={(node) => {
                  if (pointed) cursorRef.current = node;
                }}
                className={`playlist-item playlist-remote-item${
                  guestVideoId === item.videoId ? " active" : ""
                }${pointed ? " pointed" : ""}`}
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
              );
            })}
          </div>
        )}
      </div>

      {/* The moving highlight is only a colour; this is what says it out
          loud for anyone arrowing through the list without seeing it. */}
      <div className="sr-only" role="status" aria-live="polite">
        {cursorRow ? cursorRow.label : ""}
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
