import { useEffect, useRef, useState } from "react";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { useAccountType } from "@/hooks/use-account-type";
import { Mic } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const voiceStatusLabels = {
  not_setup: "Not set up",
  processing: "Processing",
  ready: "Voice ready",
  failed: "Setup failed",
};

export function VoiceSetupPreview({ characterId }: { characterId: string | null }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const voice = useQuery({
    queryKey: ["character-voice-state", userId, characterId],
    enabled: !authLoading && Boolean(userId && characterId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 5000 : false),
    queryFn: async () => {
      if (!supabase || !userId || !characterId) throw new Error("Voice status is unavailable.");
      const { data, error } = await supabase
        .from("characters")
        .select("voice_provider, voice_id, voice_status, creators!inner(user_id)")
        .eq("id", characterId)
        .eq("creators.user_id", userId)
        .maybeSingle();
      if (error || !data)
        throw new Error("We couldn't load this character's voice status. Please try again.");
      const status: unknown = data.voice_status;
      if (
        status !== "not_setup" &&
        status !== "processing" &&
        status !== "ready" &&
        status !== "failed"
      ) {
        throw new Error("This character's voice status is unavailable.");
      }
      if (
        status === "ready" &&
        (data.voice_provider !== "cartesia" ||
          typeof data.voice_id !== "string" ||
          !data.voice_id.trim())
      ) {
        throw new Error("This character's saved voice setup is incomplete.");
      }
      return { provider: data.voice_provider, id: data.voice_id, status } as const;
    },
  });
  const statusText = authLoading
    ? "Loading voice status..."
    : !userId
      ? "Sign in to view voice status."
      : !characterId
        ? "Save your character to view its voice status."
        : voice.isPending || voice.isFetching
          ? "Loading voice status..."
          : voice.isError
            ? null
            : voice.data
              ? `Voice status: ${voiceStatusLabels[voice.data.status]}`
              : "Voice status unavailable.";
  return (
    <section aria-labelledby="voice-setup-heading" className="space-y-5">
      <div>
        <h2 id="voice-setup-heading" className="text-xl font-bold">
          Give your AI your voice
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Record a short sample of your own voice so your AI can speak like you during voice calls.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        {statusText ? (
          <p role="status" className="text-sm font-semibold">
            {statusText}
          </p>
        ) : (
          <div>
            <p role="alert" className="text-sm text-destructive">
              {voice.error?.message}
            </p>
            <button
              type="button"
              onClick={() => void voice.refetch()}
              className="mt-2 text-sm font-semibold text-primary"
            >
              Retry
            </button>
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Record in a quiet room and speak naturally. Use only your own voice. Recordings are
          limited to 60 seconds. Web calls still use your browser's system voice.
        </p>
      </div>
      <VoiceRecordingControls
        key={`${userId ?? "guest"}:${characterId ?? "unsaved"}`}
        characterId={characterId}
        voiceStatus={voice.data?.status}
        hasVoice={Boolean(voice.data?.id)}
        loading={authLoading || voice.isPending || voice.isFetching || voice.isError}
        refresh={async () => {
          const result = await voice.refetch();
          if (result.error) throw result.error;
        }}
      />
    </section>
  );
}

type VoiceRecordingControlsProps = {
  characterId: string | null;
  voiceStatus: string | undefined;
  hasVoice: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const recordingLanguages = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["ta", "Tamil"],
  ["te", "Telugu"],
  ["mr", "Marathi"],
  ["bn", "Bengali"],
  ["gu", "Gujarati"],
  ["kn", "Kannada"],
  ["ml", "Malayalam"],
  ["pa", "Punjabi"],
  ["es", "Spanish"],
  ["fr", "French"],
];

function VoiceRecordingControls({
  characterId,
  voiceStatus,
  hasVoice,
  loading,
  refresh,
}: VoiceRecordingControlsProps) {
  const { accountType } = useAccountType();
  const recording = useVoiceRecording();
  const [consent, setConsent] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [language, setLanguage] = useState("en");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const active = useRef(false);
  const inFlight = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const saved = Boolean(
    characterId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(characterId),
  );
  const busyRecording = ["permission", "recording", "encoding"].includes(recording.phase);
  const busy = sending || voiceStatus === "processing";
  const canRecord =
    saved && consent && accountType === "creator" && !loading && !busy && (!hasVoice || replacing);
  const status = busy
    ? "Creating voice..."
    : recording.phase === "recording"
      ? "Recording..."
      : recording.phase === "permission"
        ? "Requesting microphone permission..."
        : recording.phase === "encoding"
          ? "Preparing recording..."
          : recording.phase === "complete"
            ? "Recording complete"
            : voiceStatus === "ready" && !replacing
              ? "Voice ready"
              : voiceStatus === "failed" && !replacing
                ? "Setup failed"
                : "Ready to record";

  const createVoice = async () => {
    if (!canRecord || !recording.audio || !characterId || !supabase || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError(null);
    setNotice(null);
    const body = new FormData();
    body.append("character_id", characterId);
    body.append("audio", recording.audio, "creator-voice.wav");
    body.append("consent", "true");
    body.append("language", language);
    if (hasVoice && replacing) body.append("replace", "true");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "clone-character-voice",
        { body },
      );
      if (!active.current) return;
      if (invokeError || data?.success !== true) {
        // Supabase puts non-2xx function JSON in FunctionsHttpError.context.
        const failure =
          invokeError?.context instanceof Response
            ? await invokeError.context
                .clone()
                .json()
                .catch(() => null)
            : data;
        if (!active.current) return;
        const message =
          typeof failure?.error === "string"
            ? failure.error.slice(0, 900)
            : "Voice setup could not complete. Check the saved status and try again.";
        const status =
          typeof failure?.cartesia_http_status === "number"
            ? ` (Cartesia HTTP ${failure.cartesia_http_status})`
            : "";
        setError(`${message}${status} Your previous voice, if any, was kept.`);
      } else {
        recording.reset();
        setReplacing(false);
        setNotice("Voice created. Web-call playback has not switched to this voice yet.");
      }
    } catch {
      if (active.current)
        setError(
          "The request could not be confirmed. Refresh the saved status before trying again.",
        );
    } finally {
      if (active.current) {
        setConsent(false);
        try {
          await refresh();
        } catch {
          if (active.current)
            setError(
              "We couldn't refresh the saved voice status. Refresh before retrying; your request may have completed.",
            );
        }
        if (active.current) setSending(false);
      }
      inFlight.current = false;
    }
  };

  return (
    <div className="space-y-4">
      {!recording.supported ? (
        <p className="text-sm text-muted-foreground">
          Voice recording is not supported in this browser. Try a browser with microphone recording
          support.
        </p>
      ) : null}
      {!saved ? (
        <p className="text-sm text-muted-foreground">Save your character before recording.</p>
      ) : null}
      {accountType !== "creator" ? (
        <p className="text-sm text-muted-foreground">
          Only the character's creator can set up its voice.
        </p>
      ) : null}
      <p role="status" className="text-sm font-semibold">
        {status}
      </p>
      {hasVoice && !replacing ? (
        <Button
          type="button"
          variant="outline"
          disabled={busy || loading || accountType !== "creator"}
          onClick={() => {
            recording.reset();
            setConsent(false);
            setReplacing(true);
            setError(null);
            setNotice(null);
          }}
        >
          Replace voice
        </Button>
      ) : null}
      {replacing ? (
        <p className="text-sm text-muted-foreground">
          Give fresh consent and make a new recording. Your saved voice is only replaced after the
          new clone succeeds.
        </p>
      ) : null}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          disabled={
            !saved || busy || busyRecording || accountType !== "creator" || (hasVoice && !replacing)
          }
          onChange={(event) => {
            setConsent(event.target.checked);
            if (!event.target.checked) recording.reset();
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          I confirm this is my voice and I consent to MindLink creating an AI voice clone for this
          character.
        </span>
      </label>
      <label className="block text-sm font-medium">
        Recording language
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          disabled={busy || busyRecording}
          className="mt-2 block h-11 rounded-xl border border-input bg-card px-3.5"
        >
          {recordingLanguages.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Recording duration: {Math.floor(recording.duration)}s
      </p>
      {recording.previewUrl ? (
        <audio controls src={recording.previewUrl} className="w-full" />
      ) : null}
      <div className="flex flex-wrap gap-3">
        {recording.phase === "recording" ? (
          <Button type="button" variant="danger" onClick={recording.stop}>
            Stop recording
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canRecord || !recording.supported || busyRecording}
            onClick={() => {
              setError(null);
              setNotice(null);
              void recording.start();
            }}
          >
            <Mic className="h-4 w-4" /> {recording.audio ? "Record again" : "Start recording"}
          </Button>
        )}
        {recording.audio ? (
          <Button
            type="button"
            disabled={!canRecord || busyRecording}
            onClick={() => void createVoice()}
          >
            {sending ? "Creating voice..." : "Create my voice"}
          </Button>
        ) : null}
        {recording.phase === "permission" ? (
          <Button type="button" variant="outline" onClick={recording.reset}>
            Cancel
          </Button>
        ) : null}
      </div>
      {recording.error || error ? (
        <p role="alert" className="text-sm text-destructive">
          {error ?? recording.error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-success">
          {notice}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Only a completed recording is sent, after you choose Create my voice. Your recording is sent
        to Cartesia to create the clone.
      </p>
    </div>
  );
}
