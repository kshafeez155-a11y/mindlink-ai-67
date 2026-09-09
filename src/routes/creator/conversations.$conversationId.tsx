import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AssistantMessage } from "@/components/AssistantMessage";
import { creatorNavItems, PageHeader } from "@/components/CreatorNav";
import { DashShell } from "@/components/DashShell";
import { Card } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/creator/conversations/$conversationId")({
  component: ConversationDetailPage,
});

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type CharacterRelation = { name: string | null } | Array<{ name: string | null }> | null;

type ConversationRecord = {
  id: string;
  audience_user_id: string;
  created_at: string;
  updated_at: string;
  characters: CharacterRelation;
};

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function ConversationDetailPage() {
  const { conversationId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [audienceName, setAudienceName] = useState("Audience member");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadConversation = async () => {
      if (authLoading) return;
      if (!user || !supabase || !isUuid(conversationId)) {
        if (mounted) {
          setConversation(null);
          setMessages([]);
          setError("Conversation not found or you don't have access to it.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      const { data, error: conversationError } = await supabase
        .from("conversations")
        .select("id, audience_user_id, created_at, updated_at, characters!inner(name)")
        .eq("id", conversationId)
        .maybeSingle();

      if (!mounted) return;
      if (conversationError || !data) {
        setConversation(null);
        setMessages([]);
        setError("Conversation not found or you don't have access to it.");
        setLoading(false);
        return;
      }

      const conversationRecord = data as ConversationRecord;
      setConversation(conversationRecord);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", conversationRecord.audience_user_id)
        .maybeSingle();
      if (mounted && profile?.full_name?.trim()) setAudienceName(profile.full_name.trim());

      const { data: messageRows, error: messagesError } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (messagesError) {
        setMessages([]);
        setError("We couldn't load this conversation's messages.");
      } else {
        setMessages(
          ((Array.isArray(messageRows) ? messageRows : []) as ConversationMessage[]).filter(
            (message) => message.role === "user" || message.role === "assistant",
          ),
        );
      }
      setLoading(false);
    };

    void loadConversation();
    return () => {
      mounted = false;
    };
  }, [authLoading, conversationId, user]);

  const characterRelation = conversation?.characters;
  const characterName = Array.isArray(characterRelation)
    ? characterRelation[0]?.name?.trim() || "AI character"
    : characterRelation?.name?.trim() || "AI character";
  const latestActivity = conversation ? formatDate(conversation.updated_at) : "";

  return (
    <DashShell items={creatorNavItems}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader
          title={characterName}
          subtitle={`${audienceName} · ${latestActivity}`}
          action={
            <Link
              to="/creator/conversations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-deep"
            >
              <ArrowLeft className="h-4 w-4" /> Back to conversations
            </Link>
          }
        />

        <Card className="mt-8 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading conversation...</p>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : messages.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              This conversation has no messages yet.
            </p>
          ) : (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 text-sm text-muted-foreground">
                <span>{audienceName}</span>
                <span>{messages.length} messages</span>
              </div>
              {messages.map((message, index) => (
                <div
                  key={`${message.created_at}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-white sm:max-w-[70%]"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 sm:max-w-[70%]"
                  }
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                  ) : (
                    <AssistantMessage content={message.content} />
                  )}
                  <p
                    className={`mt-2 text-[11px] ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {formatDate(message.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashShell>
  );
}
