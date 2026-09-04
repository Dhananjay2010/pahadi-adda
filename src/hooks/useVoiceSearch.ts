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
type SpeechResultEvent = { resultIndex: number; results: SpeechResultList };
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

/** Long enough to collect your thoughts, short enough not to sit there
 *  with the microphone open all afternoon. */
const SILENCE_LIMIT_MS = 15000;
/** How long after someone stops talking before the phrase is taken as
 *  finished. Leaves room for "बेडु पाको … बारो मासा". */
const SETTLE_MS = 1600;
/** Breathing room before restarting a session the engine dropped. */
const RESTART_DELAY_MS = 150;
/** A broken engine that ends instantly would otherwise restart forever. */
const MAX_SESSIONS = 40;

/**
 * Dictation for the search box — mostly for phones, where typing a song
 * name in Devanagari is real work and saying it isn't.
 *
 * Almost all of the work here is holding the microphone open, because the
 * browser engines will not do it. Chrome ends a recognition session at the
 * first pause it hears, which in practice means the moment the button is
 * pressed and before anyone has started speaking: `onend` arrives within a
 * few hundred milliseconds, the mic goes dark, and it looks broken. Safari
 * behaves the same way and ignores `continuous` altogether. Firing
 * `no-speech` and calling it a day is also normal for both.
 *
 * So a "listening" state here is not one recognition session — it's as
 * many as it takes. `continuous` asks the engine not to stop at a pause,
 * and whenever it stops anyway the session is restarted underneath, with
 * the UI none the wiser. What actually ends listening is one of: a phrase
 * that has settled, a stretch of silence, the button being pressed again,
 * or a real error like a refused microphone.
 */
export function useVoiceSearch(onTranscript: (text: string) => void) {
  // Safe to read the window during render: this hook only ever runs inside
  // the playlist panel, which is mounted by a click, never server-rendered.
  const [supported] = useState(() => recognitionConstructor() !== null);
  const [status, setStatus] = useState<VoiceStatus>("idle");

  const recognitionRef = useRef<Recognition | null>(null);
  // Whether the listener still wants to be listening. Every restart below
  // is gated on this, so stopping really stops.
  const wantsRef = useRef(false);
  const langRef = useRef("hi-IN");
  const sessionsRef = useRef(0);
  const heardRef = useRef(false);
  // A restarted session starts its results from scratch, so anything the
  // engine had already settled on is kept here and prefixed to whatever
  // the new session hears. Without this, a drop-out mid-phrase would
  // silently swallow the first half of it.
  const committedRef = useRef("");
  const sessionFinalRef = useRef("");
  const timersRef = useRef<{ settle?: number; silence?: number; restart?: number }>({});
  const transcriptRef = useRef(onTranscript);

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

  /** Ends listening for good, with whatever the UI should say about it. */
  const finish = useCallback(
    (next: VoiceStatus) => {
      wantsRef.current = false;
      clearTimers();
      try {
        recognitionRef.current?.abort();
      } catch {
        // already gone
      }
      recognitionRef.current = null;
      setStatus(next);
    },
    [clearTimers],
  );

  const beginRef = useRef<() => void>(() => {});

  const begin = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor || !wantsRef.current) return;
    if (sessionsRef.current >= MAX_SESSIONS) {
      finish(heardRef.current ? "idle" : "error");
      return;
    }
    sessionsRef.current += 1;

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onspeechstart = () => {
      heardRef.current = true;
    };

    recognition.onresult = (event) => {
      heardRef.current = true;
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

      // Every word heard pushes back both the "have they finished?" and
      // the "is anyone there?" clocks.
      const timers = timersRef.current;
      if (timers.settle) clearTimeout(timers.settle);
      if (timers.silence) clearTimeout(timers.silence);
      timers.silence = window.setTimeout(() => finish("idle"), SILENCE_LIMIT_MS);
      timers.settle = window.setTimeout(() => finish("idle"), SETTLE_MS);
    };

    recognition.onerror = (event) => {
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          finish("denied");
          return;
        case "audio-capture":
          finish("error");
          return;
        case "aborted":
        case "no-speech":
          // Both are routine: "aborted" is a restart or a deliberate stop,
          // and Chrome says "no-speech" during any ordinary silence. Let
          // onend decide whether to carry on.
          return;
        default:
          // network and friends — worth one more session before giving up.
          return;
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (sessionFinalRef.current) {
        committedRef.current = `${committedRef.current} ${sessionFinalRef.current}`.trim();
        sessionFinalRef.current = "";
      }
      if (!wantsRef.current) return;
      // The engine stopped on its own. Pick it straight back up: from the
      // listener's side nothing happened.
      timersRef.current.restart = window.setTimeout(() => beginRef.current(), RESTART_DELAY_MS);
    };

    try {
      recognition.start();
    } catch {
      // start() throws if a session is somehow still running; the retry
      // below is the same recovery as any other unexpected end.
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
      try {
        recognitionRef.current?.abort();
      } catch {
        // nothing running
      }
      recognitionRef.current = null;

      langRef.current = lang;
      wantsRef.current = true;
      sessionsRef.current = 0;
      heardRef.current = false;
      committedRef.current = "";
      sessionFinalRef.current = "";
      setStatus("listening");
      timersRef.current.silence = window.setTimeout(
        () => finish(heardRef.current ? "idle" : "unheard"),
        SILENCE_LIMIT_MS,
      );
      begin();
    },
    [begin, clearTimers, finish],
  );

  const stop = useCallback(() => finish("idle"), [finish]);

  // Don't leave the microphone open when the panel closes.
  useEffect(
    () => () => {
      wantsRef.current = false;
      clearTimers();
      try {
        recognitionRef.current?.abort();
      } catch {
        // already gone
      }
    },
    [clearTimers],
  );

  return { supported, status, start, stop };
}
