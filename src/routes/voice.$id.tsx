import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mic, PhoneOff, ShieldCheck, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssistantMessage } from "@/components/AssistantMessage";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card } from "@/components/ui/primitives";
import { useBrowserVoice } from "@/hooks/use-browser-voice";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/voice/$id")({ component: VoicePage });

type VoiceCharacter = {
  id: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  status: string;
};
type Message = { role: "user" | "assistant"; content: string };

function VoicePage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  return (
    <SiteLayout>
      <VoiceSession
        key={`${id}:${loading ? "loading" : (user?.id ?? "guest")}`}
        id={id}
        userId={user?.id ?? null}
        authLoading={loading}
      />
    </SiteLayout>
  );
}

function VoiceSession({
  id,
  userId,
  authLoading,
}: {
  id: string;
  userId: string | null;
  authLoading: boolean;
}) {
  const navigate = useNavigate();
  const ended = useRef(false);
  const [character, setCharacter] = useState<VoiceCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const conversationId = useRef<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const voice = useBrowserVoice((text) => {
    void send(text);
  });

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) throw new Error("We couldn't load this character right now.");
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        ) {
          throw new Error("We couldn't find this published character.");
        }
        const result = await supabase
          .from("characters")
          .select("id, name, tagline, description, avatar_url, status")
          .eq("id", id)
          .eq("status", "published")
          .maybeSingle();
        if (cancelled) return;
        if (result.error) throw new Error("We couldn't load this character right now.");
        if (!result.data) throw new Error("We couldn't find this published character.");
        setCharacter(result.data as VoiceCharacter);
        if (!userId || authLoading) return;
        try {
          const conversation = await supabase
            .from("conversations")
            .select("id")
            .eq("audience_user_id", userId)
            .eq("character_id", id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (conversation.error) throw conversation.error;
          if (!conversation.data) return;
          conversationId.current = conversation.data.id;
          const history = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("conversation_id", conversation.data.id)
            .order("created_at", { ascending: true });
          if (cancelled) return;
          if (history.error) throw history.error;
          setMessages(
            (history.data ?? []).filter(
              (message) => message.role === "user" || message.role === "assistant",
            ) as Message[],
          );
        } catch {
          if (!cancelled)
            setHistoryError(
              "We couldn't restore all of your conversation. You can still talk with this AI.",
            );
        }
      } catch (cause) {
        if (!cancelled)
          setLoadError(cause instanceof Error ? cause.message : "We couldn't load this character.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [id, userId, authLoading]);

  async function send(text: string) {
    const message = text;
    if (!mounted.current || ended.current || inFlight.current || loading || !message.trim()) return;
    if (!character || !supabase || authLoading || !userId) {
      setError("Sign in to talk with this AI.");
      return;
    }
    if (message.length > 4000) {
      setError("That spoken message is too long. Please try a shorter question.");
      return;
    }
    inFlight.current = true;
    setSending(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const requestBody: { character_id: string; message: string; conversation_id?: string } = {
        character_id: character.id,
        message,
      };
      if (conversationId.current) requestBody.conversation_id = conversationId.current;
      const { data, error: invokeError } = await supabase.functions.invoke("chat-character", {
        body: requestBody,
      });
      if (!mounted.current || ended.current) return;
      if (invokeError || typeof data?.answer !== "string" || !data.answer.trim()) {
        throw new Error("The character is temporarily unavailable.");
      }
      if (typeof data.conversation_id === "string") conversationId.current = data.conversation_id;
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      voice.speak(data.answer);
    } catch {
      if (mounted.current && !ended.current)
        setError(
          "We couldn't complete that request. It won't be retried automatically. You can try again when you're ready.",
        );
    } finally {
      if (mounted.current && !ended.current) {
        inFlight.current = false;
        setSending(false);
      }
    }
  }

  if (loading || authLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground" role="status">
        Loading voice conversation...
      </div>
    );
  if (!character)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p role="alert" className="text-destructive">
          {loadError ?? "Character not found."}
        </p>
        <Link to="/explore" className="mt-4 inline-block font-semibold text-primary">
          Explore characters
        </Link>
      </div>
    );

  const name = character.name?.trim() || "AI character";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const latestAnswer = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.content;
  const currentError = error ?? voice.error;
  const status = !userId
    ? "Sign in to start"
    : !voice.supported
      ? "Voice recognition unsupported"
      : voice.permissionDenied
        ? "Microphone permission denied"
        : voice.requestingMicrophone
          ? "Requesting microphone permission..."
          : sending
            ? "Thinking..."
            : voice.listening
              ? "Listening..."
              : voice.speaking
                ? "AI speaking..."
                : "Ready";

  const endCall = () => {
    ended.current = true;
    voice.cancelListening();
    voice.stopSpeaking();
    void navigate({ to: "/character/$id", params: { id: character.id } });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/character/$id"
        params={{ id: character.id }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="bg-navy px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="relative mx-auto w-fit">
            {voice.listening ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
            ) : null}
            {character.avatar_url && !avatarFailed ? (
              <img
                src={character.avatar_url}
                alt={name}
                onError={() => setAvatarFailed(true)}
                className="relative h-28 w-28 rounded-full border-4 border-white/20 object-cover object-top shadow-lift sm:h-36 sm:w-36"
              />
            ) : (
              <div
                className="relative grid h-28 w-28 place-items-center rounded-full border-4 border-white/20 bg-primary text-3xl font-bold sm:h-36 sm:w-36"
                aria-label={`${name} initials`}
              >
                {initials}
              </div>
            )}
          </div>
          <p className="mt-6 text-sm text-white/70" role="status" aria-live="polite">
            {status}
          </p>
          <h1 className="mt-1 text-2xl font-bold">Talk to {name}</h1>
          <p className="mt-2 text-sm text-white/70">{character.tagline || character.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant={voice.listening ? "danger" : "primary"}
              disabled={!userId || !voice.supported || sending || voice.requestingMicrophone}
              onClick={() => {
                if (inFlight.current || ended.current) return;
                setError(null);
                if (voice.listening) voice.stopListening();
                else voice.startListening();
              }}
            >
              {voice.listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {voice.listening
                ? "Finish speaking"
                : voice.speaking
                  ? "Stop playback & talk"
                  : "Tap to talk"}
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              disabled={
                !userId ||
                !latestAnswer ||
                !voice.speechSupported ||
                sending ||
                voice.listening ||
                voice.requestingMicrophone
              }
              onClick={() => {
                if (voice.speaking) voice.stopSpeaking();
                else if (latestAnswer) voice.speak(latestAnswer);
              }}
            >
              <Volume2 className="h-4 w-4" /> {voice.speaking ? "Stop playback" : "Replay answer"}
            </Button>
            <Button variant="danger" onClick={endCall}>
              <PhoneOff className="h-4 w-4" /> End Call
            </Button>
          </div>
          <Link
            to="/chat/$id"
            params={{ id: character.id }}
            className="mt-5 inline-block text-sm font-semibold text-white underline underline-offset-4"
          >
            Switch to text chat
          </Link>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          {!userId ? (
            <p>
              Sign in to talk with this AI.{" "}
              <Link to="/login" className="font-semibold text-primary underline">
                Sign in
              </Link>
            </p>
          ) : null}
          {!voice.supported ? (
            <p>
              Voice recognition is not supported in this browser. You can still chat with this AI.
            </p>
          ) : null}
          {currentError ? (
            <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
              {currentError}
            </p>
          ) : null}
          {historyError ? <p className="text-sm text-muted-foreground">{historyError}</p> : null}
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">A safe, transparent conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This AI uses {name}'s approved knowledge. It is not the real person. Answers use
                your device's system voice, not the creator's voice.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Your browser may send audio to its speech recognition service. Tap the microphone
                for each new question.
              </p>
            </div>
          </div>
          {voice.transcript &&
          (voice.listening ||
            !messages.some(
              (message) => message.role === "user" && message.content === voice.transcript,
            )) ? (
            <div>
              <p className="text-sm font-semibold">You</p>
              <p className="mt-1 whitespace-pre-wrap">{voice.transcript}</p>
            </div>
          ) : null}
          <div className="space-y-4" aria-label="Conversation">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`min-w-0 rounded-2xl p-4 ${message.role === "user" ? "bg-primary-soft" : "border border-border"}`}
              >
                <p className="mb-2 text-sm font-semibold">
                  {message.role === "user" ? "You" : name}
                </p>
                {message.role === "assistant" ? (
                  <AssistantMessage content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
