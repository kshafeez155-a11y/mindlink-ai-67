import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AssistantMessage } from "@/components/AssistantMessage";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card, buttonVariants } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/chat/$id")({ component: ChatPage });

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type ChatCharacter = {
  id: string;
  slug: string | null;
  name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  description: string | null;
  creators: {
    display_name: string | null;
    profession: string | null;
  } | null;
};

type ChatMessage = { role: "user" | "ai"; text: string; time: string };

type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Earlier"
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const suggestedQuestions = [
  "What can you help me with?",
  "Tell me about your experience.",
  "What topics do you know about?",
];

function characterInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI"
  );
}

function ChatPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [character, setCharacter] = useState<ChatCharacter | null>(null);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacter = async () => {
      if (!supabase) {
        if (mounted) {
          setCharacterError("We couldn't load this character.");
          setCharacterLoading(false);
        }
        return;
      }

      setCharacterLoading(true);
      setCharacterError(null);
      setCharacter(null);
      setConversationId(null);
      setMessages([]);
      setHistoryLoading(true);
      setAvatarFailed(false);
      const query = supabase
        .from("characters")
        .select(
          "id, slug, name, avatar_url, tagline, description, creators!inner(display_name, profession)",
        );
      const result = isUuid(id)
        ? await query.eq("id", id).maybeSingle()
        : await query.eq("slug", id).maybeSingle();

      if (!mounted) return;
      if (result.error || !result.data) {
        setCharacter(null);
        setCharacterError("We couldn't find this character.");
      } else {
        setCharacter(result.data as ChatCharacter);
      }
      setCharacterLoading(false);
    };

    void loadCharacter();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      if (characterLoading || authLoading || !character) return;
      if (!user || !supabase) {
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError(null);
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("audience_user_id", user.id)
        .eq("character_id", character.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (conversationError) {
        setConversationId(null);
        setMessages([]);
        setHistoryError("We couldn't load your previous chat. You can start a new conversation.");
        setHistoryLoading(false);
        return;
      }
      if (!conversation) {
        setConversationId(null);
        setMessages([]);
        setHistoryLoading(false);
        return;
      }

      setConversationId(conversation.id);
      const { data: storedMessages, error: messagesError } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (messagesError) {
        setMessages([]);
        setHistoryError("We couldn't load your previous messages. You can continue this chat.");
      } else {
        const restoredMessages = (Array.isArray(storedMessages) ? storedMessages : []).filter(
          (message) => message.role === "user" || message.role === "assistant",
        ) as StoredMessage[];
        setMessages(
          restoredMessages.map((message) => ({
            role: message.role === "assistant" ? "ai" : "user",
            text: message.content,
            time: formatMessageTime(message.created_at),
          })),
        );
      }
      setHistoryLoading(false);
    };

    void loadHistory();
    return () => {
      mounted = false;
    };
  }, [authLoading, character, characterLoading, user]);

  if (characterLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          Loading character...
        </div>
      </SiteLayout>
    );
  }

  if (!character) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {characterError ?? "We couldn't find this character."}
          </p>
        </div>
      </SiteLayout>
    );
  }

  if (historyLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          Loading conversation...
        </div>
      </SiteLayout>
    );
  }

  const creatorName = character.creators?.display_name ?? "the creator";
  const characterName = character.name?.trim() || "AI character";
  const subtitle =
    character.tagline ?? character.description ?? character.creators?.profession ?? "AI character";

  const startNewChat = () => {
    if (sending || authLoading || !user) return;
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setHistoryError(null);
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    if (!character) {
      setError("We couldn't find this character.");
      return;
    }
    if (authLoading || !user || !supabase) {
      setError("Please sign in before chatting with this character.");
      return;
    }

    setSending(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", text: message, time: "Now" }]);
    setDraft("");

    const requestBody: { character_id: string; message: string; conversation_id?: string } = {
      character_id: character.id,
      message,
    };
    if (conversationId) requestBody.conversation_id = conversationId;

    const { data, error: invokeError } = await supabase.functions.invoke("chat-character", {
      body: requestBody,
    });

    if (invokeError || !data?.answer) {
      setError(data?.error ?? "The character is temporarily unavailable. Please try again.");
    } else {
      if (typeof data.conversation_id === "string") {
        setConversationId(data.conversation_id);
      }
      setMessages((current) => [...current, { role: "ai", text: data.answer, time: "Now" }]);
    }
    setSending(false);
  };
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="flex min-h-[calc(100vh-12rem)] flex-col">
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <Link
              to="/character/$id"
              params={{ id: character.slug ?? character.id }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
              aria-label="Back to profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {character.avatar_url && !avatarFailed ? (
              <img
                src={character.avatar_url}
                alt={creatorName}
                onError={() => setAvatarFailed(true)}
                className="h-11 w-11 rounded-xl object-cover object-top"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-sm font-semibold text-primary-deep"
                aria-label={`${characterName} initials`}
              >
                {characterInitials(characterName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-bold">Chat with {characterName}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {subtitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI character based on {creatorName}'s approved knowledge.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={startNewChat}
              disabled={sending || authLoading || !user}
            >
              New Chat
            </Button>
            <Link
              to="/voice/$id"
              params={{ id: character.id }}
              className={`${buttonVariants({ size: "sm", variant: "outline" })} shrink-0`}
            >
              <Phone className="h-4 w-4" /> Voice
            </Link>
          </div>
          <div className="flex-1 space-y-5 py-6">
            {messages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-white sm:max-w-[70%]"
                    : "min-w-0 max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm sm:max-w-[70%]"
                }
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                ) : (
                  <AssistantMessage content={message.text} />
                )}
                <p
                  className={`mt-2 text-[11px] ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {message.time}
                </p>
              </div>
            ))}
            {error ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {historyError ? (
              <p className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                {historyError}
              </p>
            ) : null}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            className="flex gap-2 border-t border-border pt-4"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Ask ${characterName} anything...`}
              disabled={sending}
              className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <Button size="icon" aria-label="Send message" disabled={sending || !draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </main>
        <aside>
          <Card className="p-5">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Try asking
            </p>
            <div className="mt-4 space-y-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => void send(question)}
                  disabled={sending}
                  className="w-full rounded-xl border border-border px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </SiteLayout>
  );
}
