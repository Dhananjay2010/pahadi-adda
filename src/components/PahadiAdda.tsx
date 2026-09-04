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
import ShortcutsPanel from "./ShortcutsPanel";
import SeekBar from "./SeekBar";
import StartPanel from "./StartPanel";
import Tooltips from "./Tooltips";
import { usePresence } from "@/hooks/usePresence";
import { useParallax } from "@/hooks/useParallax";
import { PLAYLIST, artistOf, scheduleFromEpoch, type Track } from "@/lib/playlist";
import type { YoutubeResult } from "@/app/api/youtube-search/route";

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
  // Only one of these is ever open at a time (see `openOnly` below): they
  // sit on top of each other in the same corner, and two of them at once was
  // just two panels arguing over the same 300px.
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Set when the playlist is opened by the "/" shortcut rather than by a
  // click, so the search box takes focus for someone already typing — but
  // never on a tap, where it would throw up the on-screen keyboard over the
  // list they just asked to see.
  const [focusSearch, setFocusSearch] = useState(false);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const [trackToast, setTrackToast] = useState<{ prefix: string; name: string } | null>(
    null,
  );
  // Video mode just restyles the card — the <YouTube> element below never
  // moves in the tree, so the iframe is never torn down and playback runs
  // straight through the switch.
  const [watching, setWatching] = useState(false);
  // The start click is held here when it lands before the player exists.
  const [pendingStart, setPendingStart] = useState(false);
  // A song found through YouTube search, playing in place of a playlist
  // track. The playlist index stays where it was, so when this one ends
  // the room picks up exactly where it left off.
  const [guest, setGuest] = useState<Track | null>(null);
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
  // just 0..n-1; shuffling replaces it with a permutation. Held in state
  // because the footer renders what comes next out of it, and mirrored into
  // a ref because the timers/handlers below run outside render.
  const [order, setOrder] = useState<number[]>(() => PLAYLIST.map((_, i) => i));
  const orderRef = useRef<number[]>(order);
  const shuffleRef = useRef(false);
  const startedRef = useRef(false);
  // "The listener has asked for sound" — kept separately from `started`
  // because the ask can arrive before there's a player to act on it.
  const wantsSoundRef = useRef(false);
  const guestRef = useRef<Track | null>(null);
  // What's actually loaded in the player — a playlist track or a guest.
  const currentVideoIdRef = useRef(PLAYLIST[initial.index].videoId);
  const diyaRef = useRef<HTMLButtonElement>(null);
  // Whatever had focus when a panel was opened, so Esc can give it back.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Volume/mute are mirrored into refs so a held-down arrow key compounds
  // properly: key repeat fires many times per frame, far faster than state
  // lands, and reading state there would apply the same step over and over.
  const volumeRef = useRef(85);
  const mutedRef = useRef(false);

  const { onlineCount, joinEvents, dismissJoinEvent, reactionEvents, sendReaction, dismissReactionEvent } =
    usePresence();
  const parallaxRef = useParallax<HTMLDivElement>();

  const track = guest ?? PLAYLIST[currentIndex];
  const trackDuration = durations[track.videoId] ?? track.assumedDuration;

  const goToTrack = useCallback((index: number, offsetSeconds: number) => {
    currentIndexRef.current = index;
    currentVideoIdRef.current = PLAYLIST[index].videoId;
    guestRef.current = null;
    setGuest(null);
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

  /**
   * Turns the sound on. Browsers only allow autoplay while muted, so the
   * player starts muted and this is what unmutes it — always off the back
   * of a real click (or from onReady, replaying one).
   */
  const turnSoundOn = useCallback((player: YouTubePlayer) => {
    player.unMute();
    player.setVolume(volumeRef.current);
    player.playVideo();
    startedRef.current = true;
    wantsSoundRef.current = true;
    setPendingStart(false);
    setStarted(true);
  }, []);

  // The bug this guards against: `playerRef` is only set in onReady, and
  // on a cold or slow load the start click easily lands before that. The
  // old version optional-chained all three player calls into nothing but
  // hid the overlay anyway — leaving a player that was still on its muted
  // autoplay. The progress bar moved, the pause button said "playing", and
  // there was no sound and no way back except a reload. So the ask is
  // remembered instead, the welcome panel's button stays up saying it's
  // connecting, and onReady finishes the job the moment there's a player
  // to finish it on.
  const handleStart = useCallback(() => {
    wantsSoundRef.current = true;
    const player = playerRef.current;
    if (!player) {
      setPendingStart(true);
      return;
    }
    turnSoundOn(player);
  }, [turnSoundOn]);

  const handleReady = useCallback((event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    event.target.seekTo(initial.offset, true);
    // Someone who pressed play while the iframe was still loading is
    // waiting on this — see handleStart.
    if (wantsSoundRef.current) turnSoundOn(event.target);
  }, [initial.offset, turnSoundOn]);

  const handleStateChange = useCallback((event: { data: number; target: YouTubePlayer }) => {
    setIsPlaying(event.data === 1);
    const d = event.target.getDuration();
    if (d && d > 0) {
      const videoId = currentVideoIdRef.current;
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
    setTrackToast({ prefix: "अब बज रहा है:", name: PLAYLIST[next].dev });
  }, [goToTrack, neighbour]);

  // A video that can't be embedded (its owner switched that off) fails the
  // moment it loads. For a playlist track that's a silent skip, as before;
  // for something picked out of the search results it needs saying, or the
  // click just looks broken.
  const handlePlayerError = useCallback(() => {
    const wasGuest = guestRef.current !== null;
    const next = neighbour(1);
    goToTrack(next, 0);
    setTrackToast({
      prefix: wasGuest ? "यह वीडियो यहाँ नहीं चल सकता — अब:" : "अब बज रहा है:",
      name: PLAYLIST[next].dev,
    });
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
        setOrder(orderRef.current);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // The first-visit hint bubble that used to live up here said the one
  // thing a newcomer needs to know ("everyone is hearing this together"),
  // showed it for eight seconds, and then never again. StartPanel now says
  // it properly, at the moment it matters — on the screen you have to get
  // past to hear anything — so there is nothing left for the bubble to do.

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
  // An unMute() that arrives while the player is still buffering is
  // sometimes dropped on the floor, which lands in the same silent-but-
  // playing state. Confirm it took, and ask again for a couple of seconds
  // if it didn't. Short-lived, so it can't argue with someone who mutes
  // deliberately a moment later.
  useEffect(() => {
    if (!started) return;
    let tries = 0;
    const id = setInterval(() => {
      const player = playerRef.current;
      tries += 1;
      if (!player || tries > 6 || !wantsSoundRef.current || !player.isMuted?.()) {
        clearInterval(id);
        return;
      }
      player.unMute();
      player.setVolume(volumeRef.current);
    }, 400);
    return () => clearInterval(id);
  }, [started]);

  const applyOrder = useCallback((next: number[]) => {
    orderRef.current = next;
    setOrder(next);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
    applyOrder(next ? shuffledOrder(currentIndexRef.current) : PLAYLIST.map((_, i) => i));
    localStorage.setItem("pahadi-adda-shuffle", next ? "1" : "0");
  }, [applyOrder]);

  const handleToggleWatching = useCallback(() => {
    setWatching((v) => {
      localStorage.setItem("pahadi-adda-watching", v ? "0" : "1");
      return !v;
    });
  }, []);

  /**
   * Plays something found on YouTube that isn't in the playlist. The
   * playlist index is deliberately left alone: this is a detour, and when
   * the video ends (or is skipped) playback rejoins the list at the track
   * after the one that was playing.
   */
  const handlePlayExternal = useCallback((result: YoutubeResult) => {
    const entry: Track = {
      id: `yt-${result.videoId}`,
      videoId: result.videoId,
      dev: result.title,
      lat: result.channel || "YouTube",
      assumedDuration: result.duration ?? 0,
      views: result.views ?? 0,
    };
    guestRef.current = entry;
    currentVideoIdRef.current = entry.videoId;
    setGuest(entry);
    setElapsed(0);
    playerRef.current?.loadVideoById({ videoId: entry.videoId, startSeconds: 0 });
    playerRef.current?.playVideo();
    setPlaylistOpen(false);
    // Picking a song is as clear an ask for sound as pressing the start
    // button, and the list is reachable before that button (the "/"
    // shortcut opens it) — without this, the choice would load and play on
    // the still-muted autoplay player and simply appear not to work.
    if (!startedRef.current) handleStart();
  }, [handleStart]);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  // One place the position is set from, whether that came from the slider,
  // the ±5s buttons or the arrow keys.
  const handleSeekTo = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      const offset = Math.min(trackDuration, Math.max(0, seconds));
      player.seekTo(offset, true);
      setElapsed(offset);
    },
    [trackDuration],
  );

  const handleSeekBy = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime?.() ?? elapsed;
      handleSeekTo(current + delta);
    },
    [elapsed, handleSeekTo],
  );

  function handleSelectTrack(index: number) {
    goToTrack(index, 0);
    playerRef.current?.playVideo();
    setPlaylistOpen(false);
    if (!startedRef.current) handleStart();
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    volumeRef.current = v;
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v > 0 && muted) {
      playerRef.current?.unMute();
      mutedRef.current = false;
      wantsSoundRef.current = true;
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
      wantsSoundRef.current = true;
      setMuted(false);
    } else if (next === 0 && !mutedRef.current) {
      player.mute();
      mutedRef.current = true;
      wantsSoundRef.current = false;
      setMuted(true);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (mutedRef.current) {
      playerRef.current.unMute();
      mutedRef.current = false;
      wantsSoundRef.current = true;
      setMuted(false);
    } else {
      playerRef.current.mute();
      mutedRef.current = true;
      wantsSoundRef.current = false;
      setMuted(true);
    }
  }, []);

  // The chat, the photo credits and the shortcut sheet are all drawn in the
  // same top-right corner, so opening one closes the others rather than
  // stacking three translucent panels on the same 300px of screen. The
  // playlist lives in the dock and doesn't collide on a desktop, but it does
  // cover the lot on a phone, so it joins the same rule.
  const openOnly = useCallback((panel: "playlist" | "chat" | "credits" | "shortcuts" | null) => {
    setPlaylistOpen(panel === "playlist");
    setChatOpen(panel === "chat");
    setCreditsOpen(panel === "credits");
    setShortcutsOpen(panel === "shortcuts");
    if (panel !== "playlist") setFocusSearch(false);

    // Closing a panel takes its contents — including whatever had focus —
    // out of the document, and focus falls back to <body>: a keyboard user
    // who presses Esc loses their place and has to tab in from the top
    // again. Hand it back to whatever opened the panel, once React has
    // actually removed it.
    if (panel) {
      returnFocusRef.current ??= document.activeElement as HTMLElement | null;
      return;
    }
    const opener = returnFocusRef.current;
    returnFocusRef.current = null;
    if (opener?.isConnected) requestAnimationFrame(() => opener.focus());
  }, []);

  const togglePanel = useCallback(
    (panel: "playlist" | "chat" | "credits" | "shortcuts", isOpen: boolean) => {
      openOnly(isOpen ? null : panel);
    },
    [openOnly],
  );

  const anyPanelOpen = playlistOpen || chatOpen || creditsOpen || shortcutsOpen;

  // Keyboard shortcuts — space plays/pauses (or starts, before the first
  // click), ←/→ scrub ±5s, shift+←/→ (or p/n, as on YouTube) change track,
  // ↑/↓ set the volume, m mutes, s shuffles, v opens the video view, "/"
  // searches, "?" lists all of this, Esc closes whatever is open.
  // Ignored while typing in the chat/nickname inputs so those keys behave
  // normally there, and while a control that answers the arrow keys itself
  // (the progress slider) has focus, which would otherwise seek twice.
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      );
    }
    function ownsKeys(target: EventTarget | null) {
      return target instanceof HTMLElement && !!target.closest("[data-owns-keys]");
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Esc is the one key that has to work from inside a text field too —
      // it is how you get back out of the search box.
      if (e.key === "Escape") {
        if (anyPanelOpen) {
          e.preventDefault();
          openOnly(null);
        }
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === "/") {
        e.preventDefault();
        setFocusSearch(true);
        openOnly("playlist");
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        togglePanel("shortcuts", shortcutsOpen);
        return;
      }
      if (ownsKeys(e.target) && e.key.startsWith("Arrow")) return;
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
    anyPanelOpen,
    openOnly,
    togglePanel,
    shortcutsOpen,
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

  // What plays after this one, so the footer can say so.
  const upNext = PLAYLIST[order[(order.indexOf(currentIndex) + 1) % order.length]];

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
        </div>
        <div className="topbar-actions">
          <div style={{ position: "relative" }}>
            <button
              className="sharelink"
              onClick={handleShare}
              data-tip="दोस्तों को यहाँ बुलाओ"
              aria-label="शेयर करें"
            >
              <ShareIcon />
              <span>शेयर करें</span>
            </button>
            {shareNotice && <div className="share-toast">लिंक कॉपी हो गया</div>}
          </div>
          <button
            className="icon-btn shortcuts-btn"
            onClick={() => togglePanel("shortcuts", shortcutsOpen)}
            data-tip="कीबोर्ड शॉर्टकट (?)"
            aria-label="कीबोर्ड शॉर्टकट"
            aria-pressed={shortcutsOpen}
          >
            <KeyboardIcon />
          </button>
          <button
            className="icon-btn credits-btn"
            onClick={() => togglePanel("credits", creditsOpen)}
            data-tip="फोटो किसकी हैं, देखें"
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
            data-tip="YouTube पर और पहाड़ी गीत खोजें"
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
        <div className="track-toast" key={`${trackToast.prefix}${trackToast.name}`}>
          <span className="track-toast-dot" />
          {trackToast.prefix} <b>{trackToast.name}</b>
        </div>
      )}

      {/* The playlist stacks directly above the player instead of opening in
          a far corner of the screen: it appears right where the button that
          opens it is, so nothing has to be chased across the viewport. */}
      <div
        className={`dock${watching ? " watching" : ""}${playlistOpen ? " listing" : ""}${
          started ? "" : " waiting"
        }`}
      >
        {playlistOpen && (
          <PlaylistPanel
            currentIndex={currentIndex}
            guestVideoId={guest?.videoId ?? null}
            autoFocusSearch={focusSearch}
            onSelect={handleSelectTrack}
            onPlayExternal={handlePlayExternal}
            onClose={() => openOnly(null)}
          />
        )}
        {!started && (
          <StartPanel
            onlineCount={onlineCount}
            trackName={track.dev}
            pending={pendingStart}
            onStart={handleStart}
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
                onError={handlePlayerError}
              />
              {/* At 96x54 the player's own controls are too small to hit,
                  so in compact mode the thumbnail is one big target that
                  opens the video view instead. Dropped in video mode,
                  where the real controls are usable and get the clicks. */}
              {!watching && (
                <button
                  className="art-expand"
                  onClick={handleToggleWatching}
                  data-tip="वीडियो देखें (V)"
                  aria-label="वीडियो देखें"
                >
                  <ExpandIcon />
                </button>
              )}
            </div>
            {/* The title used to share this row with three icon buttons and
                lost: at 430px wide the name of the song — the single thing
                the card exists to say — was clipped to about 160px, so
                "Gulabi Sharara — Inder Arya & Neeru" arrived as "Gulabi
                Sharara — Inder Arya …". The buttons moved down to the
                footer row, which had to exist anyway to carry "up next",
                and the title got the width back. */}
            <div className="meta" key={track.videoId}>
              <div className="title-dev">{track.dev}</div>
              {/* The document is lang="hi"; without this the Latin line is
                  read out with Hindi phonetics. */}
              <div className="title-lat" lang="en">
                {track.lat}
              </div>
            </div>
          </div>

          <SeekBar
            elapsed={elapsed}
            duration={trackDuration}
            onSeek={handleSeekTo}
            disabled={!started}
          />
          <div className="times">
            <span>{fmt(elapsed)}</span>
            <span>{fmt(trackDuration)}</span>
          </div>

          <div className="controls">
            <div className="controls-side">
              <button
                ref={diyaRef}
                className="ctrl-btn reaction-btn"
                onClick={() => sendReaction("🪔")}
                data-tip="सबके लिए दिया जलाएं"
                aria-label="दिया जलाएं"
              >
                🪔
              </button>
              <button
                className={`ctrl-btn shuffle-btn${shuffle ? " on" : ""}`}
                onClick={handleToggleShuffle}
                data-tip={shuffle ? "शफल बंद करें — क्रम से चलेगा (S)" : "शफल करें — बेतरतीब चलेगा (S)"}
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
                data-tip="पिछला गीत (Shift + ← या P)"
                aria-label="पिछला गीत"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6v12L9 12z" /></svg>
              </button>
              <button
                className="ctrl-btn seek-btn"
                onClick={() => handleSeekBy(-5)}
                data-tip="5 सेकंड पीछे (←)"
                aria-label="5 सेकंड पीछे"
              >
                <SeekBackIcon />
              </button>
              <button
                className={`ctrl-btn play-btn${isPlaying ? " is-playing" : ""}`}
                onClick={handlePlayPause}
                data-tip={isPlaying ? "रोकें (Space)" : "चलाएं (Space)"}
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
                data-tip="5 सेकंड आगे (→)"
                aria-label="5 सेकंड आगे"
              >
                <SeekForwardIcon />
              </button>
              <button
                className="ctrl-btn"
                onClick={handleNext}
                data-tip="अगला गीत (Shift + → या N)"
                aria-label="अगला गीत"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6v12l11-6z" /></svg>
              </button>
            </div>

            <div className="controls-side controls-volume">
              <button
                className="ctrl-btn mute-btn"
                onClick={handleToggleMute}
                data-tip={muted ? "आवाज़ वापस लाएं (M)" : "म्यूट करें (M)"}
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
                style={{ "--filled": `${muted ? 0 : volume}%` } as React.CSSProperties}
                data-tip="आवाज़ (↑ / ↓)"
                aria-label="आवाज़"
              />
            </div>
          </div>

          {/* The footer earns its row twice over: it says what is coming
              next — which a station that plays 95 songs in a fixed order
              had no way of telling anyone — and it gives the three
              secondary actions a home away from the title, with the one
              that matters most (the list) finally carrying a word instead
              of three near-identical 32px glyphs. */}
          <div className="card-foot">
            <div className="upnext">
              <span className="upnext-label">आगे</span>
              <span className="upnext-name">{upNext.dev}</span>
              {/* The artist only: the Latin line repeats the song name, and
                  in a row this narrow that repetition is what pushes the
                  name of the singer off the end. */}
              <span className="upnext-lat" lang="en">
                {artistOf(upNext)}
              </span>
            </div>
            <div className="card-foot-actions">
              <button
                className={`foot-btn${watching ? " on" : ""}`}
                onClick={handleToggleWatching}
                data-tip={watching ? "वीडियो छोटा करें (V)" : "वीडियो भी देखें (V)"}
                aria-label={watching ? "वीडियो छोटा करें" : "वीडियो भी देखें"}
                aria-pressed={watching}
              >
                {watching ? <ShrinkIcon /> : <ExpandIcon />}
              </button>
              <a
                className="foot-btn"
                href={`https://www.youtube.com/watch?v=${track.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                data-tip="यह गीत YouTube पर खोलें"
                aria-label="YouTube पर खोलें"
              >
                <YtIcon />
              </a>
              <button
                className={`foot-btn foot-btn-wide${playlistOpen ? " on" : ""}`}
                onClick={() => togglePanel("playlist", playlistOpen)}
                data-tip="सारे 95 गीत, और खोज (/)"
                aria-label="पूरी सूची देखें"
                aria-pressed={playlistOpen}
              >
                <ListIcon />
                <span>सूची</span>
              </button>
            </div>
          </div>

          {/* Not started yet: the card stays visible and readable (the
              welcome panel above is doing the asking) but nothing in it is
              live, and a click anywhere on it starts the sound. Blocking
              the controls is deliberate — a "next" pressed before the
              unmute lands changes the song silently, which is the exact
              failure this whole start dance exists to avoid. */}
          {!started && (
            <button
              className="start-scrim"
              onClick={handleStart}
              disabled={pendingStart}
              tabIndex={-1}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {creditsOpen && <PhotoCredits onClose={() => openOnly(null)} />}
      {shortcutsOpen && <ShortcutsPanel onClose={() => openOnly(null)} />}

      <JoinToasts events={joinEvents} onDismiss={dismissJoinEvent} />
      <ReactionBursts
        events={reactionEvents}
        originRef={diyaRef}
        onDismiss={dismissReactionEvent}
      />
      <ChatPanel isOpen={chatOpen} onOpenChange={(open) => openOnly(open ? "chat" : null)} />
      <Tooltips />

      {/* Everything above is either a picture or a control with no running
          commentary, so a track change is silent to a screen reader unless
          it is said out loud here. */}
      <div className="sr-only" role="status" aria-live="polite">
        {started ? `अब बज रहा है: ${track.dev}, ${track.lat}` : ""}
      </div>
    </>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="2.2" y="6" width="19.6" height="12" rx="2.4" />
      <path d="M6 9.6h.01M9.2 9.6h.01M12.4 9.6h.01M15.6 9.6h.01M18.4 9.6h.01M6 12.8h.01M9.2 12.8h.01M12.4 12.8h.01M15.6 12.8h.01M18.4 12.8h.01M8 15.6h8" strokeLinecap="round" />
    </svg>
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
