import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CircleDollarSign, FileText, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { creatorNavItems, PageHeader } from "@/components/CreatorNav";
import { DashShell } from "@/components/DashShell";
import { Card, StatsCard } from "@/components/ui/primitives";
import {
  analyticsSeries,
  dashboardStats,
  earnings,
  getCharacter,
  knowledgeSources,
  recentActivity,
} from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function CreatorWorkspace({ section = "Dashboard" }: { section?: string }) {
  const page = creatorPages[section] ?? creatorPages.Dashboard;
  return (
    <DashShell items={CreatorNavItems}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{page}</div>
    </DashShell>
  );
}

const CreatorNavItems = creatorNavItems;

const creatorPages: Record<string, ReactNode> = {
  Dashboard: <DashboardPage />,
  "My Character": <CharacterPage />,
  Knowledge: <KnowledgePage />,
  Conversations: <ConversationsPage />,
  Analytics: <AnalyticsPage />,
  Earnings: <EarningsPage />,
  Settings: <SettingsPage />,
};

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Creator dashboard"
        subtitle="A quick view of how your AI character is helping people."
        action={
          <Link
            to="/creator/character"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-deep"
          >
            Edit character <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/creator/conversations" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {recentActivity.map((item) => (
              <div key={item.title} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Character status</h2>
          <div className="mt-5 flex items-center gap-4">
            <img
              src={getCharacter("rahul-sharma").photo}
              alt="Rahul AI"
              className="h-16 w-16 rounded-2xl object-cover object-top"
            />
            <div>
              <p className="font-semibold">Rahul AI</p>
              <p className="mt-1 text-sm text-muted-foreground">Entrepreneur &amp; Investor</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Published
              </span>
            </div>
          </div>
          <Link
            to="/creator/character"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Manage character <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}

type CreatorCharacter = {
  id: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  status: "draft" | "published";
};

function CharacterPage() {
  const { user, loading: authLoading } = useAuth();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [character, setCharacter] = useState<CreatorCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacter = async () => {
      if (authLoading) return;
      if (!user || !supabase) {
        if (mounted) {
          setError("Sign in to manage your character.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (creatorError) {
        if (mounted) {
          setError("We couldn't load your creator account. Please try again.");
          setLoading(false);
        }
        return;
      }
      if (!creator) {
        if (mounted) {
          setError("Create a character before managing its publication status.");
          setLoading(false);
        }
        return;
      }
      setCreatorId(creator.id);

      const { data: characterRecord, error: characterError } = await supabase
        .from("characters")
        .select("id, name, tagline, description, avatar_url, status")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (characterError || !characterRecord) {
        setError("We couldn't load your character. Please try again.");
      } else {
        setCharacter(characterRecord as CreatorCharacter);
      }
      setLoading(false);
    };

    void loadCharacter();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  const updateStatus = async () => {
    if (!character || !creatorId || !supabase || !user || updating) return;
    const nextStatus = character.status === "published" ? "draft" : "published";
    if (
      nextStatus === "draft" &&
      !window.confirm("Unpublish this character from public Explore?")
    ) {
      return;
    }

    setUpdating(true);
    setError(null);
    setNotice(null);
    const { error: updateError } = await supabase
      .from("characters")
      .update({ status: nextStatus })
      .eq("id", character.id)
      .eq("creator_id", creatorId);
    if (updateError) {
      setError("We couldn't update your character's publication status. Please try again.");
    } else {
      setCharacter((current) => (current ? { ...current, status: nextStatus } : current));
      setNotice(nextStatus === "published" ? "Character published." : "Character unpublished.");
    }
    setUpdating(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your character...</p>;
  }

  if (!character) {
    return <p className="text-sm text-destructive">{error ?? "Character not found."}</p>;
  }

  const characterName = character.name?.trim() || "AI character";
  const initials =
    characterName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI";

  return (
    <>
      <PageHeader
        title="My character"
        subtitle="Shape how your AI character represents your expertise."
        action={
          <Link
            to="/creator/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create another <Sparkles className="h-4 w-4" />
          </Link>
        }
      />
      <Card className="mt-8 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={characterName}
              className="h-24 w-24 rounded-2xl object-cover object-top"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary-soft text-2xl font-bold text-primary-deep">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{characterName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {character.tagline ?? "AI character"}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{character.description}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {character.status === "published" ? "Published" : "Draft"}
            </span>
            <button
              type="button"
              onClick={() => void updateStatus()}
              disabled={updating}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
            >
              {updating
                ? "Updating..."
                : character.status === "published"
                  ? "Unpublish character"
                  : "Publish character"}
            </button>
          </div>
        </div>
      </Card>
      {notice ? <p className="mt-3 text-sm text-success">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </>
  );
}

function KnowledgePage() {
  return (
    <>
      <PageHeader
        title="Knowledge"
        subtitle="The sources your character can draw from."
        action={
          <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            Add source
          </button>
        }
      />
      <Card className="mt-8 overflow-hidden">
        <div className="divide-y divide-border">
          {knowledgeSources.map((source) => (
            <div key={source.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{source.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.type} · {source.size} · Updated {source.updated}
                </p>
              </div>
              <span className="text-xs font-semibold text-success">{source.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

type CreatorConversation = {
  id: string;
  characterName: string;
  audienceName: string;
  preview: string;
  activity: string;
  messageCount: number;
};

function formatConversationTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function ConversationsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<CreatorConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadConversations = async () => {
      if (authLoading) return;
      if (!user || !supabase) {
        if (mounted) {
          setConversations([]);
          setError("Sign in to view your conversations.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: creator, error: creatorError } = await supabase
          .from("creators")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (creatorError) throw creatorError;

        if (!creator) {
          if (mounted) setConversations([]);
          return;
        }

        const { data: characters, error: charactersError } = await supabase
          .from("characters")
          .select("id, name")
          .eq("creator_id", creator.id);
        if (charactersError) throw charactersError;

        const characterRows = characters ?? [];
        if (characterRows.length === 0) {
          if (mounted) setConversations([]);
          return;
        }

        const characterIds = characterRows.map((character) => character.id);
        const characterNames = new Map(
          characterRows.map((character) => [character.id, character.name ?? "AI character"]),
        );
        const { data: conversationRows, error: conversationsError } = await supabase
          .from("conversations")
          .select("id, character_id, audience_user_id, updated_at")
          .in("character_id", characterIds)
          .order("updated_at", { ascending: false });
        if (conversationsError) throw conversationsError;

        const rows = conversationRows ?? [];
        if (rows.length === 0) {
          if (mounted) setConversations([]);
          return;
        }

        const conversationIds = rows.map((conversation) => conversation.id);
        const { data: messageRows, error: messagesError } = await supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });
        if (messagesError) throw messagesError;

        const latestMessages = new Map<string, string>();
        const messageCounts = new Map<string, number>();
        for (const message of messageRows ?? []) {
          messageCounts.set(
            message.conversation_id,
            (messageCounts.get(message.conversation_id) ?? 0) + 1,
          );
          if (!latestMessages.has(message.conversation_id)) {
            latestMessages.set(message.conversation_id, message.content);
          }
        }

        const audienceIds = [...new Set(rows.map((conversation) => conversation.audience_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", audienceIds);
        const audienceNames = new Map(
          (profiles ?? []).map((profile) => [profile.id, profile.full_name?.trim()]),
        );

        const nextConversations = rows.map((conversation) => ({
          id: conversation.id,
          characterName: characterNames.get(conversation.character_id) ?? "AI character",
          audienceName: audienceNames.get(conversation.audience_user_id) || "Audience member",
          preview: latestMessages.get(conversation.id)?.trim() || "No messages yet.",
          activity: formatConversationTime(conversation.updated_at),
          messageCount: messageCounts.get(conversation.id) ?? 0,
        }));

        if (mounted) setConversations(nextConversations);
      } catch {
        if (mounted) {
          setConversations([]);
          setError("We couldn't load your conversations. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadConversations();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  return (
    <>
      <PageHeader title="Conversations" subtitle="See how people are using your AI characters." />
      <Card className="mt-8 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading conversations...</p>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No conversations yet. Conversations will appear here when people chat with your AI
            character.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Audience</th>
                  <th className="px-5 py-3 font-semibold">Character</th>
                  <th className="px-5 py-3 font-semibold">Latest message</th>
                  <th className="px-5 py-3 font-semibold">Messages</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conversations.map((conversation) => (
                  <tr
                    key={conversation.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none"
                    onClick={() =>
                      void navigate({
                        to: "/creator/conversations/$conversationId",
                        params: { conversationId: conversation.id },
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void navigate({
                          to: "/creator/conversations/$conversationId",
                          params: { conversationId: conversation.id },
                        });
                      }
                    }}
                  >
                    <td className="px-5 py-4 font-medium">{conversation.audienceName}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {conversation.characterName}
                    </td>
                    <td className="max-w-md truncate px-5 py-4 text-muted-foreground">
                      {conversation.preview}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{conversation.messageCount}</td>
                    <td className="px-5 py-4 text-muted-foreground">{conversation.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function AnalyticsPage() {
  const max = Math.max(...analyticsSeries.map((item) => item.chats));
  return (
    <>
      <PageHeader title="Analytics" subtitle="Weekly engagement across chat and voice." />
      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Conversations this week</h2>
          <span className="text-sm text-muted-foreground">Chat + voice</span>
        </div>
        <div className="mt-8 flex h-56 items-end gap-2 sm:gap-4">
          {analyticsSeries.map((item) => (
            <div
              key={item.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t-md bg-primary"
                  style={{ height: `${(item.chats / max) * 100}%` }}
                />
                <div
                  className="w-1/2 rounded-t-md bg-indigo/40"
                  style={{ height: `${(item.voice / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function EarningsPage() {
  return (
    <>
      <PageHeader title="Earnings" subtitle="Track your character's conversation earnings." />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatsCard value="₹24,500" label="This month" change="+9%" />
        <StatsCard value="₹80,450" label="Total paid" />
        <StatsCard value="412" label="Paid sessions" />
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="divide-y divide-border">
          {earnings.map((item) => (
            <div key={item.month} className="flex items-center gap-4 p-5">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{item.month}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.sessions} sessions</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.amount}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your creator workspace preferences." />
      <Card className="mt-8 max-w-2xl p-6">
        <div className="space-y-5">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Public character profile</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Let people discover Rahul AI on Explore.
              </span>
            </span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Conversation notifications</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Receive a digest of new activity.
              </span>
            </span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />
          </label>
          <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Save settings
          </button>
        </div>
      </Card>
    </>
  );
}
