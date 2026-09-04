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

/**
 * Dictation for the search box — mostly for phones, where typing a song
 * name in Devanagari is real work and saying it isn't.
 *
 * Recognition is single-shot: it stops on its own at the end of a phrase.
 * Interim results are passed on as they arrive so the list filters while
 * someone is still talking.
 */
export function useVoiceSearch(onTranscript: (text: string) => void) {
  // Safe to read the window during render: this hook only ever runs inside
  // the playlist panel, which is mounted by a click, never server-rendered.
  const [supported] = useState(() => recognitionConstructor() !== null);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const recognitionRef = useRef<Recognition | null>(null);
  // Held in a ref so the recognition callbacks below always call the
  // latest one without having to be rebuilt (and the recognition
  // restarted) every time the panel re-renders.
  const transcriptRef = useRef(onTranscript);
  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback((lang: string) => {
    const Ctor = recognitionConstructor();
    if (!Ctor) return;

    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      transcriptRef.current(text.trim());
    };
    recognition.onerror = (event) => {
      // "aborted" is what a deliberate restart or unmount looks like.
      if (event.error === "aborted") return;
      setStatus(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "denied"
          : event.error === "no-speech"
            ? "unheard"
            : "error",
      );
    };
    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    setStatus("listening");
    try {
      recognition.start();
    } catch {
      // start() throws if it's somehow already running; nothing to do.
      setStatus("idle");
    }
  }, []);

  // Don't leave the microphone open when the panel closes.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, status, start, stop };
}
