import { useEffect, useRef, useState } from "react";

// Normalize browser-dependent WebM/Opus or MP4/AAC into Cartesia-supported PCM WAV.
export function encodeVoiceWav(audio: AudioBuffer) {
  const frames = Math.min(audio.length, Math.floor(audio.sampleRate * 60));
  if (!frames || audio.sampleRate < 8000 || audio.sampleRate > 48000)
    throw new Error("Unsupported recording.");
  const bytes = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(bytes);
  const tag = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  tag(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, frames * 2, true);
  const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
    audio.getChannelData(i),
  );
  for (let i = 0; i < frames; i++) {
    const sample = Math.max(
      -1,
      Math.min(1, channels.reduce((sum, channel) => sum + (channel[i] ?? 0), 0) / channels.length),
    );
    view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return new Blob([bytes], { type: "audio/wav" });
}

export function useVoiceRecording() {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<"idle" | "permission" | "recording" | "encoding" | "complete">(
    "idle",
  );
  const [duration, setDuration] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resources = useRef<{
    recorder?: MediaRecorder;
    stream?: MediaStream;
    context?: AudioContext;
    timer?: ReturnType<typeof setInterval>;
  }>({});
  const generation = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const cleanup = () => {
    const { recorder, stream, context, timer } = resources.current;
    resources.current = {};
    if (timer) clearInterval(timer);
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
    busy.current = false;
  };
  useEffect(() => {
    const lifecycle = generation;
    mounted.current = true;
    setSupported(
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof window.MediaRecorder === "function" &&
        typeof window.AudioContext === "function",
    );
    return () => {
      mounted.current = false;
      lifecycle.current++;
      cleanup();
    };
  }, []);
  useEffect(() => {
    if (!audio) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audio);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  const reset = () => {
    generation.current++;
    cleanup();
    setAudio(null);
    setDuration(0);
    setError(null);
    setPhase("idle");
  };
  const stop = () => {
    const recorder = resources.current.recorder;
    if (recorder?.state === "recording") {
      setPhase("encoding");
      recorder.stop();
      resources.current.stream?.getTracks().forEach((track) => track.stop());
      if (resources.current.timer) clearInterval(resources.current.timer);
    }
  };
  const start = async () => {
    if (busy.current || !mounted.current || !supported) return;
    reset();
    busy.current = true;
    const run = generation.current;
    const current = () => mounted.current && run === generation.current;
    setPhase("permission");
    try {
      const context = new AudioContext({ sampleRate: 48000 });
      resources.current.context = context;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      resources.current.stream = stream;
      const mime = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      resources.current.recorder = recorder;
      const chunks: Blob[] = [];
      let size = 0;
      recorder.ondataavailable = (event) => {
        if (!current()) return;
        size += event.data.size;
        if (size > 16_000_000) {
          generation.current++;
          cleanup();
          setPhase("idle");
          setError("Recording is too large. Please record again.");
          return;
        }
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (!current()) return;
        generation.current++;
        cleanup();
        setPhase("idle");
        setError("Recording failed. Please record again.");
      };
      recorder.onstop = async () => {
        if (!current()) return;
        stream.getTracks().forEach((track) => track.stop());
        if (resources.current.timer) clearInterval(resources.current.timer);
        setPhase("encoding");
        try {
          const decoded = await context.decodeAudioData(
            await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer(),
          );
          if (!current()) return;
          const wav = encodeVoiceWav(decoded);
          setAudio(wav);
          setDuration(Math.min(decoded.duration, 60));
          setPhase("complete");
        } catch {
          if (current()) {
            setPhase("idle");
            setError(
              "We couldn't read this recording. Please record again in a supported browser.",
            );
          }
        } finally {
          if (current()) cleanup();
        }
      };
      recorder.start(1000);
      const started = performance.now();
      setPhase("recording");
      resources.current.timer = setInterval(() => {
        if (!current()) return;
        const seconds = (performance.now() - started) / 1000;
        setDuration(Math.min(seconds, 60));
        if (seconds >= 60) stop();
      }, 250);
    } catch (cause) {
      if (!current()) return;
      cleanup();
      setPhase("idle");
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Microphone permission denied. Allow microphone access and try again."
          : "We couldn't start recording. Check your microphone and try again.",
      );
    }
  };
  return { supported, phase, duration, audio, previewUrl, error, start, stop, reset };
}
