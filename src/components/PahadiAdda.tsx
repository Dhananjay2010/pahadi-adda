"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import HeroScene from "./HeroScene";
import AmbientParticles from "./AmbientParticles";
import CelestialBody from "./CelestialBody";
import MistLayer from "./MistLayer";
import ShootingStar from "./ShootingStar";
import ClickSparkles from "./ClickSparkles";
import JoinToasts from "./JoinToasts";
import ReactionBursts from "./ReactionBursts";
import ChatPanel from "./ChatPanel";
import PlaylistPanel from "./PlaylistPanel";
import { usePresence } from "@/hooks/usePresence";
import { useParallax } from "@/hooks/useParallax";
import { PLAYLIST, scheduleFromEpoch } from "@/lib/playlist";

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

export default function PahadiAdda() {
  const [initial] = useState(() => scheduleFromEpoch());

  const [currentIndex, setCurrentIndex] = useState(initial.index);
  const [elapsed, setElapsed] = useState(initial.offset);
  const [isPlaying, setIsPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [clock, setClock] = useState("");
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const [trackToast, setTrackToast] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Real (player-reported) durations, once known, in place of the shipped
  // estimates — kept in state so the render below can read it safely, and
  // mirrored into a ref so the timers/callbacks further down (which run
  // outside render) always see the latest value without re-subscribing.
  const [durations, setDurations] = useState<Record<string, number>>({});

  const currentIndexRef = useRef(initial.index);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const durationsRef = useRef<Record<string, number>>({});

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
  const handleEnd = useCallback(() => {
    const next = (currentIndexRef.current + 1) % PLAYLIST.length;
    goToTrack(next, 0);
    // Only on auto-advance, not on a manual prev/next/select — if you
    // picked a track yourself you already know it changed.
    setTrackToast(PLAYLIST[next].dev);
  }, [goToTrack]);

  useEffect(() => {
    if (!trackToast) return;
    const t = setTimeout(() => setTrackToast(null), 5000);
    return () => clearTimeout(t);
  }, [trackToast]);

  // progress bar tick
  useEffect(() => {
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (typeof t === "number") setElapsed(t);
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
    goToTrack((currentIndexRef.current - 1 + PLAYLIST.length) % PLAYLIST.length, 0);
    playerRef.current?.playVideo();
  }, [goToTrack]);

  const handleNext = useCallback(() => {
    goToTrack((currentIndexRef.current + 1) % PLAYLIST.length, 0);
    playerRef.current?.playVideo();
  }, [goToTrack]);

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

  const handleStart = useCallback(() => {
    playerRef.current?.unMute();
    playerRef.current?.setVolume(volume);
    playerRef.current?.playVideo();
    setStarted(true);
  }, [volume]);

  function handleSelectTrack(index: number) {
    goToTrack(index, 0);
    playerRef.current?.playVideo();
    setPlaylistOpen(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v > 0 && muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  }

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }, [muted]);

  // Keyboard shortcuts — space to play/pause (or start, before the first
  // click), arrows for prev/next, m to mute. Ignored while typing in the
  // chat/nickname inputs so those keys behave normally there.
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
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "m" || e.key === "M") {
        handleToggleMute();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, handleStart, handlePlayPause, handleNext, handlePrev, handleToggleMute]);

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
        <HeroScene />
        <MistLayer />
        <CelestialBody />
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
            <button className="sharelink" onClick={handleShare}>
              <ShareIcon />
              <span>शेयर करें</span>
            </button>
            {shareNotice && <div className="share-toast">लिंक कॉपी हो गया</div>}
          </div>
          <a
            className="ytlink"
            href="https://www.youtube.com/results?search_query=pahadi+uttarakhandi+songs"
            target="_blank"
            rel="noopener noreferrer"
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
            />
          </div>
          <div className="meta" key={currentIndex}>
            <div className="title-dev">{track.dev}</div>
            <div className="title-lat">{track.lat}</div>
          </div>
          <button
            className="openyt"
            onClick={() => setPlaylistOpen((v) => !v)}
            title="पूरी सूची देखें"
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
            title="YouTube पर खोलें"
            aria-label="YouTube पर खोलें"
          >
            <YtIcon />
          </a>
        </div>

        <div className="seek" onClick={handleSeek}>
          <div className="seek-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="times">
          <span>{fmt(elapsed)}</span>
          <span>{fmt(trackDuration)}</span>
        </div>

        <div className="controls">
          <button
            className="ctrl-btn reaction-btn"
            onClick={() => sendReaction("🪔")}
            title="दिया जलाएं"
            aria-label="दिया जलाएं"
          >
            🪔
          </button>

          <div className="controls-transport">
            <button className="ctrl-btn" onClick={handlePrev} aria-label="पिछला गीत">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6v12L9 12z" /></svg>
            </button>
            <button
              className={`ctrl-btn play-btn${isPlaying ? " is-playing" : ""}`}
              onClick={handlePlayPause}
              aria-label="चलाएं / रोकें"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button className="ctrl-btn" onClick={handleNext} aria-label="अगला गीत">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6v12l11-6z" /></svg>
            </button>
          </div>

          <div className="controls-side">
            <button
              className="ctrl-btn mute-btn"
              onClick={handleToggleMute}
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
              aria-label="आवाज़"
            />
          </div>
        </div>

        {!started && (
          <button className="start-overlay" onClick={handleStart}>
            🔊 सुनना शुरू करें
          </button>
        )}
      </div>

      {playlistOpen && (
        <PlaylistPanel
          currentIndex={currentIndex}
          onSelect={handleSelectTrack}
          onClose={() => setPlaylistOpen(false)}
        />
      )}

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
