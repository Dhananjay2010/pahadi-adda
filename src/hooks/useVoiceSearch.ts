"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The Web Speech API isn't in TypeScript's DOM library, and in Chrome and
 * Safari it's still only there under the `webkit` prefix, so the small
 * part of it used here is described locally.
 */
type SpeechAlternative = { transcript: string };
type SpeechResult = { 0: SpeechAlternative; isFinal: boolean };
type SpeechResultList = { length: number; [index: number]: SpeechResult };
type SpeechResultEvent = { results: SpeechResultList };
type SpeechErrorEvent = { error: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceStatus = "idle" | "listening" | "denied" | "unheard" | "error";
/** Which flavour of failure, for a message the listener can act on. */
export type VoiceProblem = "no-mic" | "engine" | null;
/**
 * How far the engine has actually got, so the listening line can say
 * something true rather than a hopeful "listening…". The difference
 * between "the microphone never opened" and "the microphone is open but
 * nothing is being recognised" is the whole diagnosis when this goes
 * wrong, and nobody can open a console on a phone to find out.
 */
export type VoiceStage = "starting" | "mic-open" | "hearing";

/** How long a phrase is given to finish before it's taken as complete. */
const SETTLE_MS = 1600;
/** How long to hold the microphone open with nothing being said. */
const SILENCE_LIMIT_MS = 15000;
/** Breathing room before picking a dropped session back up. */
const RESTART_DELAY_MS = 250;
/**
 * Chrome hands the microphone back some time after a session is told to
 * stop, and a session started inside that window comes up deaf — the
 * microphone light is on and no words ever arrive, which is exactly what
 * "it worked once and then never again" looks like. So a new listening
 * session waits this long after the last one was let go.
 */
const DEVICE_SETTLE_MS = 350;
/**
 * Sessions in a row that never even opened the microphone before
 * concluding this browser can't do it. Only sessions with no `audiostart`
 * count: a session that opened the microphone and heard silence is just
 * someone gathering their thoughts, and the silence limit covers that. One
 * that never opens it at all, over and over, is a recogniser with nothing
 * behind it — Brave ships the API with the service switched off — and
 * should say so instead of blinking the microphone at someone who is
 * talking to it.
 */
const DEAD_SESSION_LIMIT = 4;

/**
 * Dictation for the search box — mostly for phones, where typing a song
 * name in Devanagari is real work and saying it isn't.
 *
 * Two things make this more code than it looks like it should be.
 *
 * The first is that browsers will not hold the microphone open: Chrome
 * ends a session at the first pause it hears, which is usually before the
 * listener has started speaking, and Safari does the same while ignoring
 * `continuous` outright. So one "listening" state is however many sessions
 * it takes, restarted underneath with the UI none the wiser.
 *
 * The second is that those restarts have to be watertight. `abort()` ends
 * a session but its `onend` still arrives afterwards, so a session that
 * has been thrown away can wake up in the middle of the *next* one and
 * null out its reference — which drops the only strong reference the new
 * session had and leaves the microphone live but deaf. That's why every
 * handler checks it still owns the current session, and why sessions are
 * detached before being aborted.
 */
export function useVoiceSearch(onTranscript: (text: string) => void) {
  // Safe to read the window during render: this hook only ever runs inside
  // the playlist panel, which is mounted by a click, never server-rendered.
  const [supported] = useState(() => recognitionConstructor() !== null);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [problem, setProblem] = useState<VoiceProblem>(null);
  const [stage, setStage] = useState<VoiceStage>("starting");
  /** The engine's own word for what went wrong, shown as-is so it can be
   *  reported back by someone who can't open a console. */
  const [code, setCode] = useState<string | null>(null);

  const recognitionRef = useRef<Recognition | null>(null);
  const wantsRef = useRef(false);
  const langRef = useRef("hi-IN");
  const timersRef = useRef<{ settle?: number; silence?: number; restart?: number }>({});
  // Across the whole listening state, not one session.
  const heardRef = useRef(false);
  const sawAudioRef = useRef(false);
  const deadRunRef = useRef(0);
  // Text the engine settled on in earlier sessions, kept so a drop-out
  // mid-phrase doesn't swallow the first half of it.
  const committedRef = useRef("");
  const sessionFinalRef = useRef("");
  const transcriptRef = useRef(onTranscript);
  const releasedAtRef = useRef(0);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const clearTimers = useCallback(() => {
    const timers = timersRef.current;
    if (timers.settle) clearTimeout(timers.settle);
    if (timers.silence) clearTimeout(timers.silence);
    if (timers.restart) clearTimeout(timers.restart);
    timersRef.current = {};
  }, []);

  /**
   * Cuts a session loose: its events can no longer reach anything here.
   * Detaching first matters — `abort()` and `stop()` both deliver `onend`
   * afterwards, and a discarded session waking up inside the next one is
   * how the live session used to lose its footing.
   *
   * `stop()` by default, because it lets the engine wind down and hand the
   * microphone back cleanly; `abort()` is for tearing down on unmount,
   * where nobody is waiting for it to be tidy.
   */
  const release = useCallback((abrupt = false) => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onaudiostart = null;
    recognition.onspeechstart = null;
    releasedAtRef.current = Date.now();
    try {
      if (abrupt) recognition.abort();
      else recognition.stop();
    } catch {
      // already finished
    }
  }, []);

  const finish = useCallback(
    (next: VoiceStatus, why: VoiceProblem = null, errorCode: string | null = null) => {
      wantsRef.current = false;
      clearTimers();
      release();
      setProblem(why);
      setCode(errorCode);
      setStatus(next);
    },
    [clearTimers, release],
  );

  const beginRef = useRef<() => void>(() => {});

  const begin = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor || !wantsRef.current) return;

    const recognition = new Ctor();
    // Assigned before start() so the handlers below can tell straight away
    // whether they're still the session in charge.
    recognitionRef.current = recognition;
    const mine = () => recognitionRef.current === recognition;

    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let audioThisSession = false;

    recognition.onaudiostart = () => {
      if (!mine()) return;
      audioThisSession = true;
      sawAudioRef.current = true;
      setStage((current) => (current === "starting" ? "mic-open" : current));
    };

    recognition.onspeechstart = () => {
      if (!mine()) return;
      heardRef.current = true;
      setStage("hearing");
    };

    recognition.onresult = (event) => {
      if (!mine()) return;
      heardRef.current = true;
      deadRunRef.current = 0;
      setStage("hearing");

      let text = "";
      let settled = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        text += piece;
        if (event.results[i].isFinal) settled += piece;
      }
      sessionFinalRef.current = settled.trim();
      const full = `${committedRef.current} ${text}`.replace(/\s+/g, " ").trim();
      if (full) transcriptRef.current(full);

      // Every word heard pushes back both the "have they finished?" and the
      // "is anyone there?" clocks.
      const timers = timersRef.current;
      if (timers.settle) clearTimeout(timers.settle);
      if (timers.silence) clearTimeout(timers.silence);
      timers.silence = window.setTimeout(() => finish("idle"), SILENCE_LIMIT_MS);
      timers.settle = window.setTimeout(() => finish("idle"), SETTLE_MS);
    };

    recognition.onerror = (event) => {
      if (!mine()) return;
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          finish("denied", null, event.error);
          return;
        case "audio-capture":
          finish("error", "no-mic", event.error);
          return;
        case "network":
          // The recogniser couldn't reach whatever does the recognising.
          // Retrying this forever is what leaves the mic blinking.
          finish("error", "engine", event.error);
          return;
        default:
          // "aborted" and "no-speech" are routine; let onend decide.
          if (event.error !== "aborted" && event.error !== "no-speech") {
            setCode(event.error);
          }
          return;
      }
    };

    recognition.onend = () => {
      if (!mine()) return;
      recognitionRef.current = null;

      if (sessionFinalRef.current) {
        committedRef.current = `${committedRef.current} ${sessionFinalRef.current}`.trim();
        sessionFinalRef.current = "";
      }
      if (!wantsRef.current) return;

      // Only sessions that never opened the microphone count towards
      // giving up; one that opened it and heard silence is normal.
      deadRunRef.current = audioThisSession ? 0 : deadRunRef.current + 1;
      if (deadRunRef.current >= DEAD_SESSION_LIMIT && !heardRef.current) {
        finish("error", sawAudioRef.current ? "engine" : "engine");
        return;
      }
      timersRef.current.restart = window.setTimeout(() => beginRef.current(), RESTART_DELAY_MS);
    };

    try {
      recognition.start();
    } catch {
      // start() throws if a session is somehow still running; treat it like
      // any other unexpected end.
      recognitionRef.current = null;
      timersRef.current.restart = window.setTimeout(() => beginRef.current(), RESTART_DELAY_MS);
    }
  }, [finish]);

  // Held in a ref so a session can start the next one without `begin`
  // having to refer to itself before it exists.
  useEffect(() => {
    beginRef.current = begin;
  }, [begin]);

  const start = useCallback(
    (lang: string) => {
      if (!recognitionConstructor()) return;
      clearTimers();
      release();

      langRef.current = lang;
      wantsRef.current = true;
      heardRef.current = false;
      sawAudioRef.current = false;
      deadRunRef.current = 0;
      committedRef.current = "";
      sessionFinalRef.current = "";
      setProblem(null);
      setCode(null);
      setStage("starting");
      setStatus("listening");
      timersRef.current.silence = window.setTimeout(
        () => finish(heardRef.current ? "idle" : "unheard"),
        SILENCE_LIMIT_MS,
      );
      // The microphone lights up now; the engine starts once the device is
      // certain to be free.
      const sinceRelease = Date.now() - releasedAtRef.current;
      const wait = Math.max(0, DEVICE_SETTLE_MS - sinceRelease);
      if (wait === 0) begin();
      else timersRef.current.restart = window.setTimeout(() => beginRef.current(), wait);
    },
    [begin, clearTimers, finish, release],
  );

  const stop = useCallback(() => finish("idle"), [finish]);

  // Don't leave the microphone open when the panel closes.
  useEffect(
    () => () => {
      wantsRef.current = false;
      clearTimers();
      release(true);
    },
    [clearTimers, release],
  );

  return { supported, status, stage, problem, code, start, stop };
}
