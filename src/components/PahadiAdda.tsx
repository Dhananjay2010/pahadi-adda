"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import { SCENES } from "@/components/scenes";
import SceneSwitcher from "./SceneSwitcher";
import AmbientParticles from "./AmbientParticles";
import JoinToasts from "./JoinToasts";
import ChatPanel from "./ChatPanel";
import { usePresence } from "@/hooks/usePresence";
import { useScene } from "@/hooks/useScene";
import { PLAYLIST, scheduleFromEpoch } from "@/lib/playlist";

const RESYNC_EVERY_MS = 45_000;
const DRIFT_TOLERANCE_S = 4;

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
  // Real (player-reported) durations, once known, in place of the shipped
  // estimates — kept in state so the render below can read it safely, and
  // mirrored into a ref so the timers/callbacks further down (which run
  // outside render) always see the latest value without re-subscribing.
  const [durations, setDurations] = useState<Record<string, number>>({});

  const currentIndexRef = useRef(initial.index);
  const manualRef = useRef(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const durationsRef = useRef<Record<string, number>>({});

  const { onlineCount, joinEvents, dismissJoinEvent } = usePresence();
  const { sceneId, setSceneId } = useScene();

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

  const handleEnd = useCallback(() => {
    if (manualRef.current) {
      const next = (currentIndexRef.current + 1) % PLAYLIST.length;
      goToTrack(next, 0);
    } else {
      const s = scheduleFromEpoch(durationsRef.current);
      goToTrack(s.index, s.offset);
    }
  }, [goToTrack]);

  // periodic resync for passive (non-manual) listeners
  useEffect(() => {
    const id = setInterval(() => {
      if (manualRef.current || !playerRef.current) return;
      const s = scheduleFromEpoch(durationsRef.current);
      const playerTime = playerRef.current.getCurrentTime?.() ?? 0;
      const sameTrack = s.index === currentIndexRef.current;
      const drift = Math.abs(s.offset - playerTime);
      if (!sameTrack || drift > DRIFT_TOLERANCE_S) {
        goToTrack(s.index, s.offset);
      }
    }, RESYNC_EVERY_MS);
    return () => clearInterval(id);
  }, [goToTrack]);

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

  function handlePrev() {
    manualRef.current = true;
    goToTrack((currentIndexRef.current - 1 + PLAYLIST.length) % PLAYLIST.length, 0);
    playerRef.current?.playVideo();
  }

  function handleNext() {
    manualRef.current = true;
    goToTrack((currentIndexRef.current + 1) % PLAYLIST.length, 0);
    playerRef.current?.playVideo();
  }

  function handlePlayPause() {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const offset = pct * trackDuration;
    manualRef.current = true;
    playerRef.current?.seekTo(offset, true);
    setElapsed(offset);
  }

  function handleStart() {
    playerRef.current?.unMute();
    playerRef.current?.setVolume(85);
    playerRef.current?.playVideo();
    setStarted(true);
  }

  const progressPct = trackDuration ? Math.min(100, (elapsed / trackDuration) * 100) : 0;

  return (
    <>
      {SCENES.map((scene) => (
        <div
          key={scene.id}
          className={`scene-layer${scene.id === sceneId ? " active" : ""}`}
        >
          <scene.Component />
        </div>
      ))}
      <AmbientParticles />

      <div className="topbar">
        <div>
          <div className="clock">{clock}</div>
          {onlineCount !== null && (
            <div className="online">
              <span className="dot" />
              माहौल में <b>{onlineCount}</b> लोग
            </div>
          )}
          <SceneSwitcher activeId={sceneId} onChange={setSceneId} />
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

      <div className="plaque-wrap">
        <h1 className="plaque-title">पहाड़ी अड्डा</h1>
        <div className="plaque-sub">Pahadi Adda &middot; लगातार पहाड़ी गीत</div>
      </div>

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

        {!started && (
          <button className="start-overlay" onClick={handleStart}>
            🔊 सुनना शुरू करें
          </button>
        )}
      </div>

      <JoinToasts events={joinEvents} onDismiss={dismissJoinEvent} />
      <ChatPanel />
    </>
  );
}

function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12Z" />
    </svg>
  );
}
