import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileText, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { creatorNavItems, PageHeader } from "@/components/CreatorNav";
import { DashShell } from "@/components/DashShell";
import { Card, StatsCard } from "@/components/ui/primitives";
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
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading your dashboard...
      </p>
    );
  }
  return <DashboardContent key={user?.id ?? "signed-out"} userId={user?.id} />;
}

type DashboardCharacter = Pick<CreatorCharacter, "id" | "name" | "status">;

function DashboardContent({ userId }: { userId: string | undefined }) {
  const [characters, setCharacters] = useState<DashboardCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      setCharacters([]);
      try {
        if (!userId) throw new Error("Sign in to view your creator dashboard.");
        if (!supabase)
          throw new Error("Your dashboard is unavailable because Supabase is not configured.");
        const { data: creator, error: creatorError } = await supabase
          .from("creators")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!mounted) return;
        if (creatorError)
          throw new Error("We couldn't load your creator account. Please try again.");
        if (!creator) return;

        // Fetch every page so Supabase's response limit does not truncate the counts.
        const allCharacters: DashboardCharacter[] = [];
        const pageSize = 500;
        let offset = 0;
        while (mounted) {
          const { data, error: characterError } = await supabase
            .from("characters")
            .select("id, name, status")
            .eq("creator_id", creator.id)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + pageSize - 1);
          if (!mounted) return;
          if (characterError)
            throw new Error("We couldn't load your characters. Please try again.");
          const rows = (data ?? []) as DashboardCharacter[];
          if (rows.length === 0) break;
          allCharacters.push(...rows);
          offset += rows.length;
        }
        if (mounted) setCharacters(allCharacters);
      } catch (cause) {
        if (mounted)
          setError(
            cause instanceof Error
              ? cause.message
              : "We couldn't load your dashboard. Please try again.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [userId, attempt]);

  return (
    <>
      <PageHeader
        title="Creator dashboard"
        subtitle="Your AI characters at a glance."
        action={
          <Link
            to="/creator/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create new AI <Sparkles className="h-4 w-4" />
          </Link>
        }
      />
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-5">
          <Link
            to="/creator/character"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-deep"
          >
            Manage characters <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/creator/conversations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-deep"
          >
            View conversations <MessageSquare className="h-4 w-4" />
          </Link>
        </div>
      </Card>
      {loading ? (
        <p role="status" className="mt-8 text-sm text-muted-foreground">
          Loading your dashboard...
        </p>
      ) : error ? (
        <Card className="mt-8 p-6">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
            className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatsCard label="Total characters" value={String(characters.length)} />
            <StatsCard
              label="Published characters"
              value={String(
                characters.filter((character) => character.status === "published").length,
              )}
            />
            <StatsCard
              label="Draft characters"
              value={String(characters.filter((character) => character.status === "draft").length)}
            />
          </div>
          <Card className="mt-8 p-5 sm:p-6">
            <h2 className="font-semibold">Recent characters</h2>
            {characters.length === 0 ? (
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven't created an AI character yet.
                </p>
                <Link
                  to="/creator/onboarding"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Create AI
                </Link>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-border">
                {characters.slice(0, 5).map((character) => (
                  <div
                    key={character.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {character.name?.trim() || "AI character"}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${character.status === "published" ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground"}`}
                      >
                        {character.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-4">
                      <Link
                        to="/chat/$id"
                        params={{ id: character.id }}
                        className="text-sm font-semibold text-primary hover:text-primary-deep"
                      >
                        Test AI
                      </Link>
                      {character.status === "published" ? (
                        <Link
                          to="/character/$id"
                          params={{ id: character.id }}
                          className="text-sm font-semibold text-primary hover:text-primary-deep"
                        >
                          View profile
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
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
  const [characters, setCharacters] = useState<CreatorCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacters = async () => {
      if (authLoading) return;
      setCharacters([]);
      setCreatorId(null);
      setNotice(null);
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
      if (!mounted) return;
      if (creatorError) {
        if (mounted) {
          setError("We couldn't load your creator account. Please try again.");
          setLoading(false);
        }
        return;
      }
      if (!creator) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }
      setCreatorId(creator.id);

      const { data: characterRecords, error: characterError } = await supabase
        .from("characters")
        .select("id, name, tagline, description, avatar_url, status")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (characterError) {
        setError("We couldn't load your characters. Please try again.");
      } else {
        setCharacters((characterRecords ?? []) as CreatorCharacter[]);
      }
      setLoading(false);
    };

    void loadCharacters();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  const updateStatus = async (character: CreatorCharacter) => {
    if (!creatorId || !supabase || !user || updatingId) return;
    const nextStatus = character.status === "published" ? "draft" : "published";
    if (
      nextStatus === "draft" &&
      !window.confirm("Unpublish this character from public Explore?")
    ) {
      return;
    }

    setUpdatingId(character.id);
    setError(null);
    setNotice(null);
    try {
      const { error: updateError } = await supabase
        .from("characters")
        .update({ status: nextStatus })
        .eq("id", character.id)
        .eq("creator_id", creatorId);
      if (updateError) throw updateError;
      setCharacters((current) =>
        current.map((item) => (item.id === character.id ? { ...item, status: nextStatus } : item)),
      );
      setNotice(
        `${character.name?.trim() || "Character"} ${nextStatus === "published" ? "published" : "unpublished"}.`,
      );
    } catch {
      setError("We couldn't update your character's publication status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your characters...</p>;
  }

  return (
    <>
      <PageHeader
        title="My characters"
        subtitle="Manage the AI characters that represent your expertise."
        action={
          <Link
            to="/creator/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create another <Sparkles className="h-4 w-4" />
          </Link>
        }
      />
      {!error && characters.length === 0 ? (
        <Card className="mt-8 p-6 text-center">
          <p className="text-sm text-muted-foreground">You haven't created an AI character yet.</p>
          <Link
            to="/creator/onboarding"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create your first AI
          </Link>
        </Card>
      ) : null}
      {characters.map((character) => {
        const characterName = character.name?.trim() || "AI character";
        const initials =
          characterName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "AI";
        return (
          <Card key={character.id} className="mt-8 p-6">
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
                {character.tagline ? (
                  <p className="mt-1 text-sm text-muted-foreground">{character.tagline}</p>
                ) : null}
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  {character.description}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {character.status === "published" ? "Published" : "Draft"}
                </span>
                <Link
                  to="/chat/$id"
                  params={{ id: character.id }}
                  className="text-sm font-semibold text-primary hover:text-primary-deep"
                >
                  Test AI
                </Link>
                {character.status === "published" ? (
                  <Link
                    to="/character/$id"
                    params={{ id: character.id }}
                    className="text-sm font-semibold text-primary hover:text-primary-deep"
                  >
                    View profile
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void updateStatus(character)}
                  disabled={updatingId !== null}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
                >
                  {updatingId === character.id
                    ? "Updating..."
                    : character.status === "published"
                      ? "Unpublish character"
                      : "Publish character"}
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      {notice ? <p className="mt-3 text-sm text-success">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </>
  );
}

type WorkspaceKnowledgeSource = {
  id: string;
  character_id: string;
  title: string | null;
  source_type: string;
  original_filename: string | null;
  processing_status: "uploaded" | "processing" | "ready" | "failed";
  processing_error: string | null;
  created_at: string;
};

const knowledgeFields =
  "id, character_id, title, source_type, original_filename, processing_status, processing_error, created_at";

function knowledgeErrorMessage(error: string | null) {
  // Only display known public messages; parser/provider errors may contain private details.
  const safeMessages = [
    "This source type is not supported for processing yet.",
    "Only plain text documents are supported for processing right now.",
    "This file does not have a stored source path.",
    "We couldn't download this private knowledge file.",
    "We couldn't find readable text in this PDF.",
    "We couldn't find readable text in this source.",
    "We couldn't generate embeddings for this knowledge source.",
    "We couldn't generate valid embeddings for this knowledge source.",
    "Knowledge embeddings are not configured.",
  ];
  return error && safeMessages.includes(error)
    ? error
    : "Processing failed. Retry this source or add a supported file with readable text.";
}

function KnowledgePage() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading your knowledge...
      </p>
    );
  return <KnowledgeContent key={user?.id ?? "signed-out"} userId={user?.id} />;
}

function KnowledgeContent({ userId }: { userId: string | undefined }) {
  const [characters, setCharacters] = useState<Pick<CreatorCharacter, "id" | "name">[]>([]);
  const [sources, setSources] = useState<WorkspaceKnowledgeSource[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [processing, setProcessing] = useState<string[]>([]);
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});
  const active = useRef(false);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadKnowledge = async () => {
      setLoading(true);
      setError(null);
      setCharacters([]);
      setSources([]);
      setSourceErrors({});
      try {
        if (!userId) throw new Error("Sign in to view your knowledge sources.");
        if (!supabase)
          throw new Error("Knowledge is unavailable because Supabase is not configured.");
        const { data: creator, error: creatorError } = await supabase
          .from("creators")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!mounted) return;
        if (creatorError)
          throw new Error("We couldn't load your creator account. Please try again.");
        if (!creator) return;

        const owned: Pick<CreatorCharacter, "id" | "name">[] = [];
        for (let offset = 0; mounted;) {
          const { data, error: queryError } = await supabase
            .from("characters")
            .select("id, name")
            .eq("creator_id", creator.id)
            .order("id")
            .range(offset, offset + 499);
          if (!mounted) return;
          if (queryError) throw new Error("We couldn't load your characters. Please try again.");
          if (!data?.length) break;
          owned.push(...data);
          offset += data.length;
        }
        const records: WorkspaceKnowledgeSource[] = [];
        // Bound the ID filter size and paginate each batch to include every owned source.
        for (let batch = 0; batch < owned.length; batch += 100) {
          const ids = owned.slice(batch, batch + 100).map((character) => character.id);
          for (let offset = 0; mounted;) {
            const { data, error: queryError } = await supabase
              .from("knowledge_sources")
              .select(knowledgeFields)
              .in("character_id", ids)
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
              .range(offset, offset + 499);
            if (!mounted) return;
            if (queryError)
              throw new Error("We couldn't load your knowledge sources. Please try again.");
            if (!data?.length) break;
            records.push(...(data as WorkspaceKnowledgeSource[]));
            offset += data.length;
          }
        }
        records.sort(
          (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id),
        );
        if (mounted) {
          setCharacters(owned);
          setSources(records);
          setFilter((current) =>
            owned.some((character) => character.id === current) ? current : "",
          );
        }
      } catch (cause) {
        if (mounted)
          setError(
            cause instanceof Error
              ? cause.message
              : "We couldn't load your knowledge. Please try again.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadKnowledge();
    return () => {
      mounted = false;
    };
  }, [userId, attempt]);

  const processSource = async (source: WorkspaceKnowledgeSource) => {
    if (
      !supabase ||
      !userId ||
      inFlight.current.has(source.id) ||
      !characters.some((character) => character.id === source.character_id) ||
      (source.processing_status !== "uploaded" && source.processing_status !== "failed")
    )
      return;
    inFlight.current.add(source.id);
    setProcessing([...inFlight.current]);
    setSourceErrors((current) => ({ ...current, [source.id]: "" }));
    let actionError = "";
    try {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("process-knowledge", {
          body: { knowledge_source_id: source.id },
        });
        if (invokeError || data?.error)
          actionError =
            "Processing could not complete. Check the status below and retry when available.";
      } catch {
        actionError = "The processing request could not be confirmed. Refresh to check its status.";
      }
      if (!active.current) return;
      // Read the persisted status even when invocation fails; never assume Ready or Failed.
      const { data, error: refreshError } = await supabase
        .from("knowledge_sources")
        .select(knowledgeFields)
        .eq("id", source.id)
        .eq("character_id", source.character_id)
        .maybeSingle();
      if (refreshError) throw refreshError;
      if (!active.current) return;
      if (data) {
        const refreshed = data as WorkspaceKnowledgeSource;
        setSources((current) => current.map((item) => (item.id === source.id ? refreshed : item)));
        if (refreshed.processing_status === "ready") actionError = "";
      } else {
        setSources((current) => current.filter((item) => item.id !== source.id));
        actionError = "This source is no longer available. Refresh the knowledge list.";
      }
      setSourceErrors((current) => ({ ...current, [source.id]: actionError }));
    } catch {
      if (active.current)
        setSourceErrors((current) => ({
          ...current,
          [source.id]:
            "We couldn't refresh this source. Its displayed status may be outdated; refresh before retrying.",
        }));
    } finally {
      inFlight.current.delete(source.id);
      if (active.current) setProcessing([...inFlight.current]);
    }
  };

  const visibleSources = filter
    ? sources.filter((source) => source.character_id === filter)
    : sources;
  const names = new Map(
    characters.map((character) => [character.id, character.name?.trim() || "AI character"]),
  );
  const statuses = {
    uploaded: "Uploaded",
    processing: "Processing",
    ready: "Ready",
    failed: "Failed",
  };
  return (
    <>
      <PageHeader
        title="Knowledge"
        subtitle="Approved sources for your AI characters."
        action={
          <Link
            to="/creator/onboarding"
            className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add knowledge
          </Link>
        }
      />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        {characters.length > 1 ? (
          <label className="text-sm font-medium">
            <span className="mb-1.5 block">Character</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-11 max-w-full rounded-xl border border-input bg-card px-3.5 text-sm"
            >
              <option value="">All characters</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name?.trim() || "AI character"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          disabled={loading || processing.length > 0}
          onClick={() => setAttempt((current) => current + 1)}
          className="text-sm font-semibold text-primary disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <Card className="mt-4 overflow-hidden">
        {loading ? (
          <p role="status" className="p-6 text-sm text-muted-foreground">
            Loading your knowledge...
          </p>
        ) : error ? (
          <div className="p-6">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((current) => current + 1)}
              className="mt-4 text-sm font-semibold text-primary"
            >
              Try again
            </button>
          </div>
        ) : visibleSources.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {sources.length === 0
              ? "No knowledge sources yet. Add approved knowledge to train your AI."
              : "No knowledge sources for this character yet."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visibleSources.map((source) => {
              const busy = processing.includes(source.id);
              return (
                <div key={source.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {source.title?.trim() || "Untitled source"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {names.get(source.character_id)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Type: {source.source_type} ? Added {formatConversationTime(source.created_at)}
                    </p>
                    {source.original_filename ? (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        File: {source.original_filename}
                      </p>
                    ) : null}
                    {source.processing_status === "failed" && !busy ? (
                      <p className="mt-2 text-sm text-destructive">
                        {knowledgeErrorMessage(source.processing_error)}
                      </p>
                    ) : null}
                    {sourceErrors[source.id] ? (
                      <p role="alert" className="mt-2 text-sm text-destructive">
                        {sourceErrors[source.id]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      role="status"
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${source.processing_status === "ready" && !busy ? "bg-success-soft text-success" : source.processing_status === "failed" && !busy ? "bg-secondary text-destructive" : "bg-primary-soft text-primary"}`}
                    >
                      {busy ? "Processing" : (statuses[source.processing_status] ?? "Unknown")}
                    </span>
                    {busy ||
                    source.processing_status === "uploaded" ||
                    source.processing_status === "failed" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void processSource(source)}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busy
                          ? "Processing..."
                          : source.processing_status === "failed"
                            ? "Retry"
                            : "Process"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  return (
    <>
      <PageHeader title="Analytics" />
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="font-semibold">Analytics is coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Soon you'll be able to see conversations, engagement, and usage for your AI characters.
        </p>
      </Card>
    </>
  );
}

function EarningsPage() {
  return (
    <>
      <PageHeader title="Earnings" />
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="font-semibold">Earnings is coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Monetization and creator payouts will be added in a future MindLink release.
        </p>
      </Card>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="font-semibold">Settings coming soon</h2>
      </Card>
    </>
  );
}
