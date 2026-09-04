"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import PhotoHero from "./PhotoHero";
import AmbientParticles from "./AmbientParticles";
import MistLayer from "./MistLayer";
import ShootingStar from "./ShootingStar";
import ClickSparkles from "./ClickSparkles";
import JoinToasts from "./JoinToasts";
import ReactionBursts from "./ReactionBursts";
import ChatPanel from "./ChatPanel";
import PlaylistPanel from "./PlaylistPanel";
import PhotoCredits from "./PhotoCredits";
import { usePresence } from "@/hooks/usePresence";
import { useParallax } from "@/hooks/useParallax";
import { PLAYLIST, scheduleFromEpoch } from "@/lib/playlist";

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

/**
 * A Fisher-Yates shuffle of every playlist index, with `first` pulled to
 * the front so whatever is playing right now keeps playing.
 */
function shuffledOrder(first: number): number[] {
  const rest = PLAYLIST.map((_, i) => i).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

export default function PahadiAdda() {
  const [initial] = useState(() => scheduleFromEpoch());

  const [currentIndex, setCurrentIndex] = useState(initial.index);
  const [elapsed, setElapsed] = useState(initial.offset);
  const [isPlaying, setIsPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [clock, setClock] = useState("");
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const [trackToast, setTrackToast] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Video mode just restyles the card — the <YouTube> element below never
  // moves in the tree, so the iframe is never torn down and playback runs
  // straight through the switch.
  const [watching, setWatching] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  // Real (player-reported) durations, once known, in place of the shipped
  // estimates — kept in state so the render below can read it safely, and
  // mirrored into a ref so the timers/callbacks further down (which run
  // outside render) always see the latest value without re-subscribing.
  const [durations, setDurations] = useState<Record<string, number>>({});

  const currentIndexRef = useRef(initial.index);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const durationsRef = useRef<Record<string, number>>({});
  // The order playback walks, as playlist indices. In normal mode that's
  // just 0..n-1; shuffling replaces it with a permutation. Kept in a ref
  // because the timers/handlers below run outside render.
  const orderRef = useRef<number[]>(PLAYLIST.map((_, i) => i));
  const shuffleRef = useRef(false);
  const startedRef = useRef(false);
  // Volume/mute are mirrored into refs so a held-down arrow key compounds
  // properly: key repeat fires many times per frame, far faster than state
  // lands, and reading state there would apply the same step over and over.
  const volumeRef = useRef(85);
  const mutedRef = useRef(false);

  const { onlineCount, joinEvents, dismissJoinEvent, reactionEvents, sendReaction, dismissReactionEvent } =
    usePresence();
  const parallaxRef = useParallax<HTMLDivElement>();

  const track = PLAYLIST[currentIndex];
  const trackDuration = durations[track.videoId] ?? track.assumedDuration;

  const goToTrack = useCallback((index: number, offsetSeconds: number) => {
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setElapsed(offsetSeconds);
    playerRef.current?.loadVideoById({
      videoId: PLAYLIST[index].videoId,
      startSeconds: offsetSeconds,
    });
  }, []);

  /**
   * Steps `step` places through the current play order and returns the
   * playlist index that lands on, wrapping at both ends.
   */
  const neighbour = useCallback((step: number) => {
    const order = orderRef.current;
    const pos = order.indexOf(currentIndexRef.current);
    return order[(pos + step + order.length) % order.length];
  }, []);

  const handleReady = useCallback((event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    event.target.seekTo(initial.offset, true);
  }, [initial.offset]);

  const handleStateChange = useCallback((event: { data: number; target: YouTubePlayer }) => {
    setIsPlaying(event.data === 1);
    const d = event.target.getDuration();
    if (d && d > 0) {
      const videoId = PLAYLIST[currentIndexRef.current].videoId;
      durationsRef.current = { ...durationsRef.current, [videoId]: d };
      setDurations(durationsRef.current);
    }
  }, []);

  // A track always plays to its own real end and advances to the next one
  // in order, at its start — never mid-song. There used to be a periodic
  // "resync" here that re-picked the track from the shared schedule every
  // 45s using duration *estimates*, which is exactly what caused songs to
  // cut short or restart mid-track: the estimate for whichever song hadn't
  // been learned yet was often wrong enough to look, from the schedule's
  // math, like time had already run out on it. The schedule is still used
  // once, to pick where a fresh visitor's player starts — after that,
  // playback just runs forward like a normal playlist.
  //
  // Also wired up as the player's onError handler (a track gone private,
  // deleted, or region-blocked fires this the same way ending does) so a
  // single broken video skips itself instead of leaving every listener
  // stuck on a dead player until the schedule's next scheduled advance.
  const handleEnd = useCallback(() => {
    const next = neighbour(1);
    goToTrack(next, 0);
    // Only on auto-advance, not on a manual prev/next/select — if you
    // picked a track yourself you already know it changed.
    setTrackToast(PLAYLIST[next].dev);
  }, [goToTrack, neighbour]);

  useEffect(() => {
    if (!trackToast) return;
    const t = setTimeout(() => setTrackToast(null), 5000);
    return () => clearTimeout(t);
  }, [trackToast]);

  // progress bar tick — and the volume read-back. The IFrame API fires no
  // event when someone uses the player's own volume slider (which is right
  // there in video mode), so polling it is the only way our slider and mute
  // icon can follow along. Skipped until playback has been started, since
  // the player sits muted for autoplay until then.
  useEffect(() => {
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const t = player.getCurrentTime?.();
      if (typeof t === "number") setElapsed(t);
      if (!startedRef.current) return;
      const v = player.getVolume?.();
      if (typeof v === "number") {
        const rounded = Math.round(v);
        volumeRef.current = rounded;
        setVolume((cur) => (cur === rounded ? cur : rounded));
      }
      const m = player.isMuted?.();
      if (typeof m === "boolean") {
        mutedRef.current = m;
        setMuted((cur) => (cur === m ? cur : m));
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // clock
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? "pm" : "am";
      const h12 = h % 12 || 12;
      setClock(`${h12}:${m < 10 ? "0" : ""}${m}${ampm}`);
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);

  // The tab title doubles as a live "people are here right now" signal —
  // unlike an OG image (cached by crawlers for days), this updates for
  // anyone with the tab open or pinned.
  useEffect(() => {
    document.title =
      onlineCount !== null && onlineCount > 0
        ? `🎶 ${onlineCount} सुन रहे हैं · Pahadi Adda`
        : "Pahadi Adda";
  }, [onlineCount]);

  // Restore the per-browser view/order preferences from the last visit.
  // Applied a tick after mount rather than as the initial state: this page
  // is prerendered, and localStorage doesn't exist server-side, so seeding
  // state from it directly would hand React a first client render that
  // disagrees with the served HTML.
  useEffect(() => {
    const id = setTimeout(() => {
      if (localStorage.getItem("pahadi-adda-watching") === "1") setWatching(true);
      if (localStorage.getItem("pahadi-adda-shuffle") === "1") {
        shuffleRef.current = true;
        setShuffle(true);
        orderRef.current = shuffledOrder(currentIndexRef.current);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // First-visit hint — the whole point of this site (everyone hears the
  // same song live) is invisible unless you already know it, so say so
  // once, then never again.
  useEffect(() => {
    if (localStorage.getItem("pahadi-adda-seen-hint")) return;
    const showTimer = setTimeout(() => setShowHint(true), 1200);
    return () => clearTimeout(showTimer);
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    localStorage.setItem("pahadi-adda-seen-hint", "1");
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(dismissHint, 8000);
    return () => clearTimeout(t);
  }, [showHint, dismissHint]);

  const handlePrev = useCallback(() => {
    goToTrack(neighbour(-1), 0);
    playerRef.current?.playVideo();
  }, [goToTrack, neighbour]);

  const handleNext = useCallback(() => {
    goToTrack(neighbour(1), 0);
    playerRef.current?.playVideo();
  }, [goToTrack, neighbour]);

  // Shuffling is a personal thing, like skipping: it takes you off the
  // order everyone else is hearing, so it's remembered per browser rather
  // than shared. The song playing right now always stays put at the front
  // of the new order — turning shuffle on mid-song shouldn't cut it off.
  const handleToggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
    orderRef.current = next
      ? shuffledOrder(currentIndexRef.current)
      : PLAYLIST.map((_, i) => i);
    localStorage.setItem("pahadi-adda-shuffle", next ? "1" : "0");
  }, []);

  const handleToggleWatching = useCallback(() => {
    setWatching((v) => {
      localStorage.setItem("pahadi-adda-watching", v ? "0" : "1");
      return !v;
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const offset = pct * trackDuration;
    playerRef.current?.seekTo(offset, true);
    setElapsed(offset);
  }

  const handleSeekBy = useCallback(
    (delta: number) => {
      if (!playerRef.current) return;
      const current = playerRef.current.getCurrentTime?.() ?? elapsed;
      const offset = Math.min(trackDuration, Math.max(0, current + delta));
      playerRef.current.seekTo(offset, true);
      setElapsed(offset);
    },
    [elapsed, trackDuration],
  );

  const handleStart = useCallback(() => {
    playerRef.current?.unMute();
    playerRef.current?.setVolume(volume);
    playerRef.current?.playVideo();
    startedRef.current = true;
    setStarted(true);
  }, [volume]);

  function handleSelectTrack(index: number) {
    goToTrack(index, 0);
    playerRef.current?.playVideo();
    setPlaylistOpen(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    volumeRef.current = v;
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v > 0 && muted) {
      playerRef.current?.unMute();
      mutedRef.current = false;
      setMuted(false);
    }
  }

  // Nudges the volume and keeps mute honest at the ends: stepping down to
  // zero mutes, stepping up off zero unmutes.
  const handleVolumeDelta = useCallback((delta: number) => {
    const player = playerRef.current;
    if (!player) return;
    const from = mutedRef.current ? 0 : volumeRef.current;
    const next = Math.min(100, Math.max(0, from + delta));
    player.setVolume(next);
    volumeRef.current = next;
    setVolume(next);
    if (next > 0 && mutedRef.current) {
      player.unMute();
      mutedRef.current = false;
      setMuted(false);
    } else if (next === 0 && !mutedRef.current) {
      player.mute();
      mutedRef.current = true;
      setMuted(true);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (mutedRef.current) {
      playerRef.current.unMute();
      mutedRef.current = false;
      setMuted(false);
    } else {
      playerRef.current.mute();
      mutedRef.current = true;
      setMuted(true);
    }
  }, []);

  // Keyboard shortcuts — space plays/pauses (or starts, before the first
  // click), ←/→ scrub ±5s, shift+←/→ (or p/n, as on YouTube) change track,
  // ↑/↓ set the volume, m mutes, s shuffles, v opens the video view.
  // Ignored while typing in the chat/nickname inputs so those keys behave
  // normally there.
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      );
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!started) handleStart();
        else handlePlayPause();
      } else if (!started) {
        return;
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey) handleNext();
        else handleSeekBy(5);
      } else if (e.key === "ArrowLeft") {
        if (e.shiftKey) handlePrev();
        else handleSeekBy(-5);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleVolumeDelta(5);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleVolumeDelta(-5);
      } else if (e.key === "n" || e.key === "N") {
        handleNext();
      } else if (e.key === "p" || e.key === "P") {
        handlePrev();
      } else if (e.key === "m" || e.key === "M") {
        handleToggleMute();
      } else if (e.key === "s" || e.key === "S") {
        handleToggleShuffle();
      } else if (e.key === "v" || e.key === "V") {
        handleToggleWatching();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    started,
    handleStart,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleToggleMute,
    handleToggleShuffle,
    handleToggleWatching,
    handleSeekBy,
    handleVolumeDelta,
  ]);

  async function handleShare() {
    const text =
      onlineCount !== null && onlineCount > 0
        ? `पहाड़ी अड्डा — अभी ${onlineCount} लोग साथ में सुन रहे हैं। तुम भी आ जाओ 🎶`
        : "पहाड़ी अड्डा — पहाड़ी गीतों का लाइव अड्डा। सुनने आ जाओ 🎶";
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "पहाड़ी अड्डा", text, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 2000);
    }
  }

  const progressPct = trackDuration ? Math.min(100, (elapsed / trackDuration) * 100) : 0;

  return (
    <>
      <div className="hero-viewport" ref={parallaxRef}>
        <PhotoHero />
        <MistLayer />
        <ShootingStar />
      </div>
      <AmbientParticles />
      <ClickSparkles />

      <div className="topbar">
        <div>
          <div className="clock">{clock}</div>
          {onlineCount !== null && (
            <div className="online">
              <span className="dot" />
              माहौल में <b>{onlineCount}</b> लोग
            </div>
          )}
          {showHint && (
            <div className="hint-bubble">
              <span>यहाँ सब एक साथ, लाइव एक ही गीत सुन रहे हैं 🎧</span>
              <button onClick={dismissHint} aria-label="समझ गया, बंद करें">
                ✕
              </button>
            </div>
          )}
        </div>
        <div className="topbar-actions">
          <div style={{ position: "relative" }}>
            <button
              className="sharelink"
              onClick={handleShare}
              title="दोस्तों को यहाँ बुलाओ"
              aria-label="शेयर करें"
            >
              <ShareIcon />
              <span>शेयर करें</span>
            </button>
            {shareNotice && <div className="share-toast">लिंक कॉपी हो गया</div>}
          </div>
          <button
            className="credits-btn"
            onClick={() => setCreditsOpen((v) => !v)}
            title="फोटो किसकी हैं, देखें"
            aria-label="फोटो साभार"
            aria-pressed={creditsOpen}
          >
            <InfoIcon />
          </button>
          <a
            className="ytlink"
            href="https://www.youtube.com/results?search_query=pahadi+uttarakhandi+songs"
            target="_blank"
            rel="noopener noreferrer"
            title="YouTube पर और पहाड़ी गीत खोजें"
          >
            <YtIcon />
            <span>YouTube पर सुनो</span>
          </a>
        </div>
      </div>

      <div className="plaque-wrap">
        <h1 className="plaque-title">पहाड़ी अड्डा</h1>
        <div className="plaque-sub">Pahadi Adda &middot; लगातार पहाड़ी गीत</div>
      </div>

      {trackToast && (
        <div className="track-toast" key={trackToast}>
          <span className="track-toast-dot" />
          अब बज रहा है: <b>{trackToast}</b>
        </div>
      )}

      {/* The playlist stacks directly above the player instead of opening in
          a far corner of the screen: it appears right where the button that
          opens it is, so nothing has to be chased across the viewport. */}
      <div className={`dock${watching ? " watching" : ""}`}>
        {playlistOpen && (
          <PlaylistPanel
            currentIndex={currentIndex}
            onSelect={handleSelectTrack}
            onClose={() => setPlaylistOpen(false)}
          />
        )}
        <div className="card">
          <div className="card-row">
            <div className="art">
              <YouTube
                videoId={PLAYLIST[initial.index].videoId}
                opts={{
                  width: "96",
                  height: "54",
                  playerVars: {
                    autoplay: 1,
                    mute: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    iv_load_policy: 3,
                    playsinline: 1,
                  },
                }}
                onReady={handleReady}
                onStateChange={handleStateChange}
                onEnd={handleEnd}
                onError={handleEnd}
              />
              {/* At 96x54 the player's own controls are too small to hit,
                  so in compact mode the thumbnail is one big target that
                  opens the video view instead. Dropped in video mode,
                  where the real controls are usable and get the clicks. */}
              {!watching && (
                <button
                  className="art-expand"
                  onClick={handleToggleWatching}
                  title="वीडियो देखें (V)"
                  aria-label="वीडियो देखें"
                >
                  <ExpandIcon />
                </button>
              )}
            </div>
            <div className="meta" key={currentIndex}>
              <div className="title-dev">{track.dev}</div>
              <div className="title-lat">{track.lat}</div>
            </div>
            <button
              className={`openyt${watching ? " on" : ""}`}
              onClick={handleToggleWatching}
              title={watching ? "वीडियो छोटा करें (V)" : "वीडियो भी देखें (V)"}
              aria-label={watching ? "वीडियो छोटा करें" : "वीडियो भी देखें"}
              aria-pressed={watching}
            >
              {watching ? <ShrinkIcon /> : <ExpandIcon />}
            </button>
            <button
              className="openyt"
              onClick={() => setPlaylistOpen((v) => !v)}
              title="पूरी सूची देखें (सब गीत)"
              aria-label="पूरी सूची देखें"
              aria-pressed={playlistOpen}
            >
              <ListIcon />
            </button>
            <a
              className="openyt"
              href={`https://www.youtube.com/watch?v=${track.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="यह गीत YouTube पर खोलें"
              aria-label="YouTube पर खोलें"
            >
              <YtIcon />
            </a>
          </div>

          <div className="seek" onClick={handleSeek} title="गीत में कहीं भी जाएं">
            <div className="seek-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="times">
            <span>{fmt(elapsed)}</span>
            <span>{fmt(trackDuration)}</span>
          </div>

          <div className="controls">
            <div className="controls-side">
              <button
                className="ctrl-btn reaction-btn"
                onClick={() => sendReaction("🪔")}
                title="सबके लिए दिया जलाएं"
                aria-label="दिया जलाएं"
              >
                🪔
              </button>
              <button
                className={`ctrl-btn shuffle-btn${shuffle ? " on" : ""}`}
                onClick={handleToggleShuffle}
                title={shuffle ? "शफल बंद करें — क्रम से चलेगा (S)" : "शफल करें — बेतरतीब चलेगा (S)"}
                aria-label={shuffle ? "शफल बंद करें" : "शफल करें"}
                aria-pressed={shuffle}
              >
                <ShuffleIcon />
              </button>
            </div>

            <div className="controls-transport">
              <button
                className="ctrl-btn"
                onClick={handlePrev}
                title="पिछला गीत (Shift + ← या P)"
                aria-label="पिछला गीत"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6v12L9 12z" /></svg>
              </button>
              <button
                className="ctrl-btn seek-btn"
                onClick={() => handleSeekBy(-5)}
                title="5 सेकंड पीछे (←)"
                aria-label="5 सेकंड पीछे"
              >
                <SeekBackIcon />
              </button>
              <button
                className={`ctrl-btn play-btn${isPlaying ? " is-playing" : ""}`}
                onClick={handlePlayPause}
                title={isPlaying ? "रोकें (Space)" : "चलाएं (Space)"}
                aria-label="चलाएं / रोकें"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button
                className="ctrl-btn seek-btn"
                onClick={() => handleSeekBy(5)}
                title="5 सेकंड आगे (→)"
                aria-label="5 सेकंड आगे"
              >
                <SeekForwardIcon />
              </button>
              <button
                className="ctrl-btn"
                onClick={handleNext}
                title="अगला गीत (Shift + → या N)"
                aria-label="अगला गीत"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6v12l11-6z" /></svg>
              </button>
            </div>

            <div className="controls-side">
              <button
                className="ctrl-btn mute-btn"
                onClick={handleToggleMute}
                title={muted ? "आवाज़ वापस लाएं (M)" : "म्यूट करें (M)"}
                aria-label={muted ? "अनम्यूट करें" : "म्यूट करें"}
              >
                {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                className="volume-slider"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                title="आवाज़ (↑ / ↓)"
                aria-label="आवाज़"
              />
            </div>
          </div>

          {!started && (
            <button
              className="start-overlay"
              onClick={handleStart}
              title="चलाना शुरू करें (Space)"
            >
              🔊 सुनना शुरू करें
            </button>
          )}
        </div>
      </div>

      {creditsOpen && <PhotoCredits onClose={() => setCreditsOpen(false)} />}

      <JoinToasts events={joinEvents} onDismiss={dismissJoinEvent} />
      <ReactionBursts events={reactionEvents} onDismiss={dismissReactionEvent} />
      <ChatPanel />
    </>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" />
    </svg>
  );
}

function SeekBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      <text
        x="12"
        y="16.4"
        fontSize="8.5"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="inherit"
      >
        5
      </text>
    </svg>
  );
}

function SeekForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <g transform="translate(24 0) scale(-1 1)">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      </g>
      <text
        x="12"
        y="16.4"
        fontSize="8.5"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="inherit"
      >
        5
      </text>
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 3.5 21.5 8 17 12.5V9.5h-1.9c-.9 0-1.7.42-2.24 1.13l-.9 1.2-1.25-1.66.9-1.2A5 5 0 0 1 15.1 7H17V3.5ZM3 7h3.9a5 5 0 0 1 4 2l5.13 6.84c.19.25.48.4.79.4H17V13l4.5 4.5L17 22v-3.5h-1.18c-.94 0-1.82-.44-2.39-1.2L8.3 10.46a1 1 0 0 0-.8-.4H3V7Zm0 9.94h4.5c.31 0 .6-.15.79-.4l.72-.96 1.25 1.66-.72.97a3 3 0 0 1-2.4 1.2H3v-2.47Z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M10 9.4v5.2l4.4-2.6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M7.5 12h9" strokeLinecap="round" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 15.5 12z" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 9v6h4l5 5V4L8 9H4zm14.7-1.3-1.4-1.4-2.6 2.6-2.6-2.6-1.4 1.4 2.6 2.6-2.6 2.6 1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 10h2v7h-2zm0-4h2v2h-2zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 16.08a2.9 2.9 0 0 0-1.96.77L8.91 12.7a3 3 0 0 0 0-1.4l7.05-4.11a3 3 0 1 0-.9-1.72L8 9.58a3 3 0 1 0 0 4.84l7.12 4.15a3 3 0 1 0 .88-1.49z" />
    </svg>
  );
}

function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12Z" />
    </svg>
  );
}
