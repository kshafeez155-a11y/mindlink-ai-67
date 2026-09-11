import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card } from "@/components/ui/primitives";
import cover from "@/assets/cover-banner.jpg";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/character/$id")({
  head: () => ({
    meta: [
      { title: "AI Character — MindLink" },
      {
        name: "description",
        content: "Meet a published MindLink AI character built from approved expertise.",
      },
    ],
  }),
  component: Profile,
});

type ProfileCharacter = {
  id: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  status: "published";
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI"
  );
}

function Profile() {
  const { id } = Route.useParams();
  const [character, setCharacter] = useState<ProfileCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacter = async () => {
      if (!supabase || !isUuid(id)) {
        setError("We couldn't find this character.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setAvatarFailed(false);
      const { data, error: queryError } = await supabase
        .from("characters")
        .select("id, name, tagline, description, avatar_url, status")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (!mounted) return;
      if (queryError || !data) {
        setCharacter(null);
        setError("We couldn't find this character.");
      } else {
        setCharacter(data as ProfileCharacter);
      }
      setLoading(false);
    };

    void loadCharacter();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
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
            {error ?? "We couldn't find this character."}
          </p>
        </div>
      </SiteLayout>
    );
  }

  const characterName = character.name?.trim() || "AI character";
  const tagline = character.tagline?.trim() || "AI character";
  const description =
    character.description?.trim() || "This character's description is not available yet.";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          to="/explore"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to explore
        </Link>
        <Card className="overflow-hidden p-0">
          <div className="relative h-40 sm:h-56">
            <img src={cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-navy/70 via-navy/30 to-transparent" />
          </div>
          <div className="relative px-5 pb-6 sm:px-8">
            <div className="grid gap-5 pt-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-end">
              <div className="-mt-20 sm:-mt-24">
                {character.avatar_url && !avatarFailed ? (
                  <img
                    src={character.avatar_url}
                    alt={characterName}
                    onError={() => setAvatarFailed(true)}
                    className="h-28 w-28 rounded-3xl border-4 border-card object-cover object-top shadow-lift sm:h-36 sm:w-36"
                  />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-card bg-primary-soft text-3xl font-bold text-primary-deep shadow-lift sm:h-36 sm:w-36">
                    {initials(characterName)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{characterName}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Published
                  </span>
                </div>
                <p className="mt-1 font-medium text-primary-deep">{tagline}</p>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-muted-foreground">{description}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/chat/$id" params={{ id: character.id }} className="sm:flex-1">
                <Button size="lg" className="w-full">
                  <MessageSquare className="h-4.5 w-4.5" /> Start Chat
                </Button>
              </Link>
              <Link to="/voice/$id" params={{ id: character.id }} className="sm:flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  <Phone className="h-4.5 w-4.5" /> Talk with AI
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0 p-5 sm:p-7">
            <h2 className="text-lg font-semibold">About this AI character</h2>
            <p className="mt-4 text-muted-foreground">{description}</p>
          </Card>
          <Card className="border-primary/25 bg-primary-soft p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
              <ShieldCheck className="h-4 w-4" /> Approved knowledge
            </p>
            <p className="mt-2 text-sm text-primary-deep/80">
              This AI character is based on approved knowledge and communication guidelines. It is
              not a real person.
            </p>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
