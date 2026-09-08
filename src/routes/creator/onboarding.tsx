import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card, Field, TextField } from "@/components/ui/primitives";
import { onboardingSteps } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/creator/onboarding")({ component: OnboardingPage });

type OnboardingForm = {
  fullName: string;
  displayName: string;
  profession: string;
  bio: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  characterName: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  personality: string;
  instructions: string;
};

type CharacterRow = {
  id: string;
  name: string | null;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  personality: string | null;
  instructions: string | null;
};

type KnowledgeSource = {
  id: string;
  source_type: "pdf" | "document" | "text" | "url" | "youtube";
  title: string;
  original_filename: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  processing_status: "uploaded" | "processing" | "ready" | "failed";
};

const initialForm: OnboardingForm = {
  fullName: "",
  displayName: "",
  profession: "",
  bio: "",
  instagramUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  websiteUrl: "",
  characterName: "",
  tagline: "",
  description: "",
  avatarUrl: "",
  personality: "",
  instructions: "",
};

function friendlySaveError(kind: "creator" | "character", message?: string) {
  if (
    message?.toLowerCase().includes("duplicate key") ||
    message?.toLowerCase().includes("unique")
  ) {
    return "That character name or slug is already in use. Try a different character name.";
  }
  return kind === "creator"
    ? "We couldn't save your creator information. Please try again."
    : "We couldn't save your character. Please try again.";
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mindlink-character"
  );
}

function friendlyKnowledgeError(message?: string) {
  if (message?.toLowerCase().includes("duplicate")) {
    return "This knowledge source has already been added.";
  }
  return "We couldn't save that knowledge source. Please try again.";
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatProcessingStatus(status: KnowledgeSource["processing_status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [knowledgeBusy, setKnowledgeBusy] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: "/login" });
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user || authLoading) return;
    const client = supabase;
    if (!client || !isSupabaseConfigured) {
      setError("Supabase is not configured. Add the required environment variables to continue.");
      setDataLoading(false);
      return;
    }

    let mounted = true;
    const loadOnboardingData = async () => {
      setDataLoading(true);
      setError(null);

      const [profileResult, creatorResult] = await Promise.all([
        client.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        client
          .from("creators")
          .select(
            "id, display_name, profession, bio, instagram_url, youtube_url, linkedin_url, website_url",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.error || creatorResult.error) {
        if (mounted) {
          setError("We couldn't load your creator information. Please refresh and try again.");
          setDataLoading(false);
        }
        return;
      }

      const creator = creatorResult.data;
      let character: CharacterRow | null = null;
      if (creator) {
        const characterResult = await client
          .from("characters")
          .select("id, name, slug, tagline, description, avatar_url, personality, instructions")
          .eq("creator_id", creator.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (characterResult.error) {
          if (mounted) {
            setError("We couldn't load your character information. Please refresh and try again.");
            setDataLoading(false);
          }
          return;
        }
        character = characterResult.data as CharacterRow | null;
      }

      if (!mounted) return;
      setCreatorId(creator?.id ?? null);
      setCharacterId(character?.id ?? null);
      setForm({
        fullName: profileResult.data?.full_name ?? "",
        displayName: creator?.display_name ?? "",
        profession: creator?.profession ?? "",
        bio: creator?.bio ?? "",
        instagramUrl: creator?.instagram_url ?? "",
        youtubeUrl: creator?.youtube_url ?? "",
        linkedinUrl: creator?.linkedin_url ?? "",
        websiteUrl: creator?.website_url ?? "",
        characterName: character?.name ?? "",
        tagline: character?.tagline ?? "",
        description: character?.description ?? "",
        avatarUrl: character?.avatar_url ?? "",
        personality: character?.personality ?? "",
        instructions: character?.instructions ?? "",
      });
      setDataLoading(false);
    };

    void loadOnboardingData();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!characterId || !supabase || step !== 2) return;
    let mounted = true;
    setSourcesLoading(true);
    void supabase
      .from("knowledge_sources")
      .select(
        "id, source_type, title, original_filename, storage_path, mime_type, file_size_bytes, processing_status",
      )
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })
      .then(({ data, error: sourceError }) => {
        if (!mounted) return;
        if (sourceError) {
          setError("We couldn't load your knowledge sources. Please try again.");
        } else {
          setSources((data ?? []) as KnowledgeSource[]);
        }
        setSourcesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [characterId, step]);

  const update = (key: keyof OnboardingForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setNotice(null);
  };

  const saveCreator = async () => {
    if (!user || !supabase) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user || sessionData.session.user.id !== user.id) {
      throw new Error("Your session expired. Please sign in again before saving.");
    }
    const profileResult = await supabase
      .from("profiles")
      .update({ full_name: form.fullName.trim(), account_type: "creator" })
      .eq("id", user.id);
    if (profileResult.error)
      throw new Error(friendlySaveError("creator", profileResult.error.message));

    const creatorPayload = {
      user_id: user.id,
      display_name: form.displayName.trim(),
      profession: form.profession.trim(),
      bio: form.bio.trim(),
      instagram_url: form.instagramUrl.trim() || null,
      youtube_url: form.youtubeUrl.trim() || null,
      linkedin_url: form.linkedinUrl.trim() || null,
      website_url: form.websiteUrl.trim() || null,
    };
    const creatorResult = await supabase
      .from("creators")
      .upsert(creatorPayload, { onConflict: "user_id" })
      .select("id")
      .single();
    if (creatorResult.error)
      throw new Error(friendlySaveError("creator", creatorResult.error.message));
    setCreatorId(creatorResult.data.id);
    return creatorResult.data.id as string;
  };

  const getUniqueSlug = async (name: string, currentCharacterId: string | null) => {
    if (!supabase) return slugify(name);
    const baseSlug = slugify(name);
    const { data, error: slugError } = await supabase
      .from("characters")
      .select("id, slug")
      .like("slug", `${baseSlug}%`);
    if (slugError) throw new Error(friendlySaveError("character", slugError.message));

    const used = new Set(
      (data ?? []).filter((row) => row.id !== currentCharacterId).map((row) => row.slug as string),
    );
    if (!used.has(baseSlug)) return baseSlug;

    const suffix = user?.id.slice(0, 8) || "mindlink";
    let candidate = `${baseSlug}-${suffix}`;
    let counter = 2;
    while (used.has(candidate)) {
      candidate = `${baseSlug}-${suffix}-${counter}`;
      counter += 1;
    }
    return candidate;
  };

  const saveCharacter = async (status: "draft" | "published", ownerId: string) => {
    if (!supabase) return;
    const slug = await getUniqueSlug(form.characterName, characterId);
    const characterPayload = {
      creator_id: ownerId,
      name: form.characterName.trim(),
      slug,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      avatar_url: form.avatarUrl.trim() || null,
      personality: form.personality.trim(),
      instructions: form.instructions.trim(),
      status,
    };
    const result = characterId
      ? await supabase
          .from("characters")
          .update(characterPayload)
          .eq("id", characterId)
          .eq("creator_id", ownerId)
          .select("id")
          .single()
      : await supabase.from("characters").insert(characterPayload).select("id").single();
    if (result.error) throw new Error(friendlySaveError("character", result.error.message));
    setCharacterId(result.data.id);
  };

  const saveDraft = async () => {
    if (!user || !supabase) return false;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const ownerId = await saveCreator();
      if (!ownerId) throw new Error("We couldn't identify your creator account.");
      if (form.characterName.trim()) await saveCharacter("draft", ownerId);
      setNotice("Draft saved.");
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "We couldn't save your draft. Please try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const loadCurrentCharacter = async () => {
    if (!user || !supabase) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user;
    if (!sessionUser || sessionUser.id !== user.id) return null;

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", sessionUser.id)
      .maybeSingle();
    if (creatorError || !creator) return null;

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (characterError || !character) return null;

    return { userId: sessionUser.id, characterId: character.id };
  };

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!user || !supabase) {
      setError("Your session is no longer available. Please sign in again.");
      return;
    }
    const allowedTypes = new Set(["application/pdf", "text/plain"]);
    if (!allowedTypes.has(file.type)) {
      setError("Only PDF and TXT files can be uploaded right now.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Files must be 10 MB or smaller.");
      return;
    }

    setKnowledgeBusy(true);
    setError(null);
    setNotice(null);
    const currentCharacter = await loadCurrentCharacter();
    if (!currentCharacter) {
      setError("Save your character before adding knowledge, then try again.");
      setKnowledgeBusy(false);
      return;
    }
    setCharacterId(currentCharacter.characterId);
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const prefix = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`;
    const uniqueFilename = `${prefix}-${safeFilename}`;
    const storagePath = `${currentCharacter.userId}/${currentCharacter.characterId}/${uniqueFilename}`;
    if (import.meta.env.DEV) console.debug("MindLink knowledge storage path:", storagePath);
    const { error: uploadError } = await supabase.storage
      .from("character-knowledge")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setError("We couldn't upload that file. Please try again.");
      setKnowledgeBusy(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("knowledge_sources")
      .insert({
        character_id: currentCharacter.characterId,
        source_type: file.type === "application/pdf" ? "pdf" : "document",
        title: file.name,
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        processing_status: "uploaded",
      })
      .select(
        "id, source_type, title, original_filename, storage_path, mime_type, file_size_bytes, processing_status",
      )
      .single();
    if (insertError) {
      const { error: cleanupError } = await supabase.storage
        .from("character-knowledge")
        .remove([storagePath]);
      if (cleanupError) console.error("Knowledge file cleanup failed", cleanupError);
      setError(friendlyKnowledgeError(insertError.message));
      setKnowledgeBusy(false);
      return;
    }
    setSources((current) => [data as KnowledgeSource, ...current]);
    setNotice("Knowledge source uploaded.");
    setKnowledgeBusy(false);
  };

  const saveNote = async () => {
    if (!supabase || !characterId) {
      setError("Save your character draft before adding a note.");
      return;
    }
    if (!noteTitle.trim() || !noteText.trim()) {
      setError("Add a title and note text before saving.");
      return;
    }
    setKnowledgeBusy(true);
    setError(null);
    setNotice(null);
    const { data, error: noteError } = await supabase
      .from("knowledge_sources")
      .insert({
        character_id: characterId,
        source_type: "text",
        title: noteTitle.trim(),
        text_content: noteText.trim(),
        processing_status: "ready",
      })
      .select(
        "id, source_type, title, original_filename, storage_path, mime_type, file_size_bytes, processing_status",
      )
      .single();
    if (noteError) {
      setError(friendlyKnowledgeError(noteError.message));
    } else {
      setSources((current) => [data as KnowledgeSource, ...current]);
      setNoteTitle("");
      setNoteText("");
      setNotice("Note saved.");
    }
    setKnowledgeBusy(false);
  };

  const deleteSource = async (source: KnowledgeSource) => {
    if (!supabase || !window.confirm(`Delete "${source.title}"?`)) return;
    setKnowledgeBusy(true);
    setError(null);
    setNotice(null);
    if (source.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("character-knowledge")
        .remove([source.storage_path]);
      if (storageError) {
        setError("We couldn't delete the stored file. The source was not removed.");
        setKnowledgeBusy(false);
        return;
      }
    }
    const { error: deleteError } = await supabase
      .from("knowledge_sources")
      .delete()
      .eq("id", source.id)
      .eq("character_id", characterId);
    if (deleteError) {
      setError("We couldn't delete that knowledge source. Please try again.");
    } else {
      setSources((current) => current.filter((item) => item.id !== source.id));
      setNotice("Knowledge source deleted.");
    }
    setKnowledgeBusy(false);
  };

  const processSource = async (source: KnowledgeSource) => {
    if (!supabase) return;
    setKnowledgeBusy(true);
    setError(null);
    setNotice(null);
    setSources((current) =>
      current.map((item) =>
        item.id === source.id ? { ...item, processing_status: "processing" } : item,
      ),
    );
    const { data, error: invokeError } = await supabase.functions.invoke("process-knowledge", {
      body: { knowledge_source_id: source.id },
    });
    if (invokeError || data?.error) {
      setError("We couldn't process this source. You can try again.");
      setSources((current) =>
        current.map((item) =>
          item.id === source.id ? { ...item, processing_status: "failed" } : item,
        ),
      );
      const { data: refreshedSources } = await supabase
        .from("knowledge_sources")
        .select(
          "id, source_type, title, original_filename, storage_path, mime_type, file_size_bytes, processing_status",
        )
        .eq("character_id", characterId)
        .order("created_at", { ascending: false });
      if (refreshedSources) setSources(refreshedSources as KnowledgeSource[]);
    } else {
      setSources((current) =>
        current.map((item) =>
          item.id === source.id ? { ...item, processing_status: "ready" } : item,
        ),
      );
      setNotice(`Source processed into ${data?.chunk_count ?? 0} chunks.`);
    }
    setKnowledgeBusy(false);
  };

  const continueStep = () => {
    if (step === onboardingSteps.length - 1) return;
    setStep((current) => current + 1);
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !supabase) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const ownerId = await saveCreator();
      if (!ownerId) throw new Error("We couldn't identify your creator account.");
      if (!form.characterName.trim()) throw new Error("Add a character name before publishing.");
      await saveCharacter("published", ownerId);
      await navigate({ to: "/creator/dashboard" });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "We couldn't publish your character. Please try again.",
      );
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <p className="text-sm text-muted-foreground">Checking your account...</p>
        </div>
      </SiteLayout>
    );
  }

  if (dataLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading your creator setup...</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <div className="mt-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Create your AI character</h1>
          <p className="mt-3 text-muted-foreground">
            Build an AI version of your expertise that can help your audience 24/7.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-5 gap-2">
          {onboardingSteps.map((label, index) => (
            <div key={label} className="text-center">
              <div
                className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${index <= step ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <p className="mt-2 hidden text-xs text-muted-foreground sm:block">{label}</p>
            </div>
          ))}
        </div>
        <Card className="mx-auto mt-8 max-w-3xl p-6 sm:p-8">
          {error ? (
            <div className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-5 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
              {notice}
            </div>
          ) : null}
          {step === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Your name"
                value={form.fullName}
                onChange={(event) => update("fullName")(event.target.value)}
                required
              />
              <Field
                label="Creator display name"
                value={form.displayName}
                onChange={(event) => update("displayName")(event.target.value)}
                required
              />
              <Field
                label="What do you do?"
                value={form.profession}
                onChange={(event) => update("profession")(event.target.value)}
                required
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Short bio"
                  value={form.bio}
                  onChange={(event) => update("bio")(event.target.value)}
                />
              </div>
              <Field
                label="Instagram URL"
                value={form.instagramUrl}
                onChange={(event) => update("instagramUrl")(event.target.value)}
              />
              <Field
                label="YouTube URL"
                value={form.youtubeUrl}
                onChange={(event) => update("youtubeUrl")(event.target.value)}
              />
              <Field
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(event) => update("linkedinUrl")(event.target.value)}
              />
              <Field
                label="Website URL"
                value={form.websiteUrl}
                onChange={(event) => update("websiteUrl")(event.target.value)}
              />
            </div>
          ) : null}
          {step === 1 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Character name"
                value={form.characterName}
                onChange={(event) => update("characterName")(event.target.value)}
                required
              />
              <Field
                label="Tagline"
                value={form.tagline}
                onChange={(event) => update("tagline")(event.target.value)}
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Character description"
                  value={form.description}
                  onChange={(event) => update("description")(event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Avatar URL (optional)"
                  value={form.avatarUrl}
                  onChange={(event) => update("avatarUrl")(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">{onboardingSteps[step]}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add approved documents and notes your character can use later. Content processing
                will be connected in the next backend step.
              </p>
              {!characterId ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Save your character draft to add knowledge sources.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => void saveDraft()}
                    disabled={saving || knowledgeBusy}
                  >
                    {saving ? "Saving..." : "Save character draft"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">Upload a file</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">PDF or TXT, up to 10 MB.</p>
                      <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-deep">
                        <Upload className="h-4 w-4" />{" "}
                        {knowledgeBusy ? "Uploading..." : "Choose file"}
                        <input
                          type="file"
                          accept="application/pdf,text/plain,.pdf,.txt"
                          className="sr-only"
                          onChange={uploadFile}
                          disabled={knowledgeBusy}
                        />
                      </label>
                    </div>
                    <div className="rounded-xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">Add a note</h3>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <Field
                          label="Note title"
                          value={noteTitle}
                          onChange={(event) => setNoteTitle(event.target.value)}
                          placeholder="Founder principles"
                        />
                        <TextField
                          label="Note text"
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          placeholder="Write approved guidance for your character..."
                        />
                        <Button
                          variant="outline"
                          onClick={() => void saveNote()}
                          disabled={knowledgeBusy}
                        >
                          {knowledgeBusy ? "Saving..." : "Save note"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Saved sources</h3>
                      <span className="text-sm text-muted-foreground">
                        {sources.length} source{sources.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {sourcesLoading ? (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading sources...
                      </div>
                    ) : sources.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
                        No knowledge sources added yet.
                      </div>
                    ) : (
                      <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                        {sources.map((source) => (
                          <div key={source.id} className="flex items-center gap-3 p-4">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{source.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {source.source_type} ·{" "}
                                {formatProcessingStatus(source.processing_status)}
                                {formatFileSize(source.file_size_bytes)
                                  ? ` · ${formatFileSize(source.file_size_bytes)}`
                                  : ""}
                              </p>
                            </div>
                            {source.processing_status === "uploaded" ||
                            source.processing_status === "failed" ? (
                              <button
                                type="button"
                                onClick={() => void processSource(source)}
                                disabled={knowledgeBusy}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft disabled:opacity-50"
                              >
                                {source.processing_status === "failed" ? "Retry" : "Process"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              aria-label={`Delete ${source.title}`}
                              onClick={() => void deleteSource(source)}
                              disabled={knowledgeBusy}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-5">
              <TextField
                label="Personality and tone"
                value={form.personality}
                onChange={(event) => update("personality")(event.target.value)}
                placeholder="Warm, direct, practical, and encouraging."
              />
              <TextField
                label="Instructions and rules"
                value={form.instructions}
                onChange={(event) => update("instructions")(event.target.value)}
                placeholder="Answer from approved expertise. Be clear about uncertainty."
              />
            </div>
          ) : null}
          {step === 4 ? (
            <div>
              <h2 className="text-xl font-bold">Review &amp; Publish</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Review label="Creator" value={form.displayName || form.fullName} />
                <Review label="Profession" value={form.profession} />
                <Review label="Character" value={form.characterName} />
                <Review label="Tagline" value={form.tagline} />
                <Review label="Personality" value={form.personality} />
                <Review label="Instructions" value={form.instructions} />
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Publishing makes this character available as a published creator profile.
              </p>
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-5">
            <div className="flex gap-3">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((value) => value - 1)}
                  disabled={saving}
                >
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < onboardingSteps.length - 1 ? (
                <Button variant="outline" onClick={() => void saveDraft()} disabled={saving}>
                  {saving ? "Saving..." : "Save draft"}
                </Button>
              ) : null}
            </div>
            {step < onboardingSteps.length - 1 ? (
              <Button onClick={() => void continueStep()} disabled={saving}>
                {saving ? "Saving..." : "Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={publish} disabled={saving}>
                {saving ? "Publishing..." : "Publish character"} <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </SiteLayout>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm">{value || "Not provided"}</p>
    </div>
  );
}
