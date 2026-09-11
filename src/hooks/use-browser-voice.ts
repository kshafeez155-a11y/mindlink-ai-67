import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

function spokenText(markdown: string) {
  return markdown
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/```[^\n]*\n?/g, "")
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\|/g, ", ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{2,}/g, ".\n")
    .trim();
}

export function useBrowserVoice(onFinalTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [requestingMicrophone, setRequestingMicrophone] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const mounted = useRef(false);
  const onFinal = useRef(onFinalTranscript);
  useEffect(() => {
    onFinal.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const stopSpeaking = useCallback(() => {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (mounted.current) setSpeaking(false);
  }, []);

  const abortRecognition = useCallback(() => {
    const current = recognition.current;
    recognition.current = null;
    if (current) {
      current.onstart = null;
      current.onresult = null;
      current.onerror = null;
      current.onend = null;
      try {
        current.abort();
      } catch {
        /* Already stopped. */
      }
    }
    if (mounted.current) {
      setListening(false);
      setRequestingMicrophone(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const browser = window as SpeechWindow;
    setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition));
    setSpeechSupported(Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance));
    return () => {
      mounted.current = false;
      abortRecognition();
      stopSpeaking();
    };
  }, [abortRecognition, stopSpeaking]);

  const startListening = useCallback(() => {
    if (!mounted.current || recognition.current) return;
    stopSpeaking();
    setError(null);
    setTranscript("");
    setPermissionDenied(false);
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) {
      setError(
        "Voice recognition is not supported in this browser. You can still chat with this AI.",
      );
      return;
    }
    try {
      const current = new Constructor();
      recognition.current = current;
      current.continuous = false;
      current.interimResults = false;
      current.lang = navigator.language || "en-US";
      let finalText = "";
      const isCurrent = () => mounted.current && recognition.current === current;
      current.onstart = () => {
        if (!isCurrent()) return;
        setRequestingMicrophone(false);
        setListening(true);
      };
      current.onresult = (event) => {
        if (!isCurrent() || finalText) return;
        finalText = Array.from(event.results)
          .filter((result) => result.isFinal)
          .map((result) => result[0].transcript)
          .join(" ");
        if (!finalText.trim()) {
          finalText = "";
          return;
        }
        setTranscript(finalText);
        // Wait for onend before submitting so capture and playback cannot overlap.
        try {
          current.stop();
        } catch {
          abortRecognition();
          setError("Microphone stopped unexpectedly. Please try again.");
        }
      };
      current.onerror = (event) => {
        if (!isCurrent()) return;
        abortRecognition();
        setPermissionDenied(event.error === "not-allowed");
        const errors: Record<string, string> = {
          "not-allowed":
            "Microphone permission denied. Allow microphone access in your browser and try again.",
          "service-not-allowed":
            "Speech recognition is not allowed by this browser. You can use text chat.",
          "no-speech": "No speech detected. Tap the microphone and try again.",
          network: "Speech recognition couldn't connect. Check your connection and try again.",
          "audio-capture": "No microphone is available. Check your microphone and try again.",
        };
        setError(errors[event.error] ?? "Speech recognition stopped. Please try again.");
      };
      current.onend = () => {
        if (!isCurrent()) return;
        recognition.current = null;
        setListening(false);
        setRequestingMicrophone(false);
        if (finalText) onFinal.current(finalText);
        else setError("No speech detected. Tap the microphone and try again.");
      };
      setRequestingMicrophone(true);
      // Starting recognition from the tap requests the browser microphone permission.
      current.start();
    } catch (cause) {
      abortRecognition();
      const denied =
        cause instanceof DOMException &&
        (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setPermissionDenied(denied);
      setError(
        denied
          ? "Microphone permission denied. Allow microphone access in your browser and try again."
          : "Couldn't start the microphone. Check browser permissions and try again.",
      );
    }
  }, [abortRecognition, stopSpeaking]);

  const stopListening = useCallback(() => {
    try {
      recognition.current?.stop();
    } catch {
      abortRecognition();
    }
  }, [abortRecognition]);

  const speak = useCallback(
    (answer: string) => {
      if (!mounted.current || recognition.current) return;
      stopSpeaking();
      setError(null);
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        setError("Spoken playback isn't supported in this browser. You can read the answer below.");
        return;
      }
      const text = spokenText(answer);
      if (!text) return;
      try {
        const current = new SpeechSynthesisUtterance(text);
        utterance.current = current;
        current.lang = navigator.language || "en-US";
        current.onend = () => {
          if (!mounted.current || utterance.current !== current) return;
          utterance.current = null;
          setSpeaking(false);
        };
        current.onerror = () => {
          if (!mounted.current || utterance.current !== current) return;
          utterance.current = null;
          setSpeaking(false);
          setError("Couldn't play the answer. Tap Replay answer to try again.");
        };
        setSpeaking(true);
        window.speechSynthesis.speak(current);
      } catch {
        stopSpeaking();
        setError("Couldn't play the answer. You can still read it below.");
      }
    },
    [stopSpeaking],
  );

  return {
    supported,
    speechSupported,
    requestingMicrophone,
    permissionDenied,
    cancelListening: abortRecognition,
    listening,
    speaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
