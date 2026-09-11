import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageSquare, Play, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { CharacterCard, type MarketplaceCharacter } from "@/components/CharacterCard";
import { Button, Card, SectionHeading } from "@/components/ui/primitives";
import { howItWorks, platformStats } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import rahul from "@/assets/creator-rahul.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindLink — Meet the AI behind people you trust" },
      {
        name: "description",
        content:
          "Talk, learn and interact with your favorite creators, experts and personal brands — anytime, through chat or browser voice.",
      },
      { property: "og:title", content: "MindLink — Meet the AI behind people you trust" },
      {
        property: "og:description",
        content:
          "An AI-powered personal-brand interaction marketplace. Chat or talk with expert AI characters.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [charactersError, setCharactersError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacters = async () => {
      if (!supabase) {
        setCharactersError("AI characters are not available right now.");
        setCharactersLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("characters")
        .select("id, name, tagline, description, avatar_url, status, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        setCharactersError(
          "We couldn't load live AI characters. Please visit Explore to try again.",
        );
      } else {
        setCharacters((data ?? []) as MarketplaceCharacter[]);
      }
      setCharactersLoading(false);
    };

    void loadCharacters();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredCharacters = useMemo(() => characters.slice(0, 6), [characters]);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 520px at 78% 8%, oklch(0.575 0.235 275 / 0.16), transparent 65%), radial-gradient(700px 420px at 10% 0%, oklch(0.62 0.16 250 / 0.12), transparent 70%)",
          }}
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-20">
          <div className="animate-rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary-deep shadow-card">
              <Sparkles className="h-3.5 w-3.5" /> AI characters built from real expertise
            </span>
            <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl">
              Meet the AI behind
              <br />
              people <span className="text-gradient-brand">you trust.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Talk, learn and interact with your favorite creators, experts and personal brands —
              anytime.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/explore">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore AI Characters <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Play className="h-4 w-4" /> Watch how it works
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {platformStats.map((s) => (
                <div key={s.label}>
                  <dt className="text-2xl font-bold sm:text-3xl">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-lift">
              <img
                src={rahul}
                alt="Demo AI character artwork"
                width={640}
                height={640}
                className="aspect-square w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/85 to-transparent p-5 pt-16">
                <p className="text-sm font-semibold text-white">Demo artwork</p>
                <p className="text-xs text-white/70">Example of a MindLink AI character</p>
              </div>
            </div>

            <div className="absolute -bottom-5 right-2 max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-card p-3.5 shadow-lift sm:right-6">
              <p className="flex items-center gap-2 text-xs font-semibold text-primary-deep">
                <MessageSquare className="h-3.5 w-3.5" /> AI character demo
              </p>
              <p className="mt-1.5 text-sm">Ask a published character anything.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVERY */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHeading
          title="Explore AI Characters"
          subtitle="Discover creators, experts and personal brands across different categories."
        />
        {charactersLoading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Loading live AI characters...
          </p>
        ) : charactersError ? (
          <p className="mt-10 text-center text-sm text-destructive">{charactersError}</p>
        ) : featuredCharacters.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="font-semibold">No AI characters are live yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to create one.</p>
            <Link to="/creator/onboarding" className="mt-5 inline-block">
              <Button size="sm">
                Create an AI character <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/explore">
            <Button variant="outline" size="lg">
              Browse all characters <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <SectionHeading
            align="center"
            title="How MindLink works"
            subtitle="Three steps between a question and the expertise you were looking for."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {howItWorks.map((s) => (
              <div key={s.step} className="rounded-2xl border border-border p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary-deep">
                  {s.step}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREATOR CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 rounded-[2rem] border border-border bg-card p-7 shadow-card sm:p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Turn your expertise into a{" "}
              <span className="text-gradient-brand">24/7 AI character.</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Your audience has questions around the clock. Let your AI character handle everyday
              conversations while you focus on the conversations that matter most.
            </p>
            <Link to="/creator/onboarding" className="mt-8 inline-block">
              <Button size="lg">
                Create Your AI Character <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy px-6 py-16 text-center sm:px-10 lg:py-20">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Your audience shouldn't have to wait.
          </h2>
          <p className="mt-4 text-base text-white/70">Make your expertise available 24/7.</p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function DashboardPreview() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold">Creator dashboard</p>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
          Published
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5">
        {[
          { v: "1,248", l: "Conversations" },
          { v: "320", l: "Voice sessions" },
          { v: "87", l: "Returning users" },
          { v: "4.9", l: "Avg. rating" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border p-4">
            <p className="text-xl font-bold">{s.v}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 px-5 pb-6">
        {[38, 55, 42, 70, 88, 64, 52].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-primary/80" style={{ height: `${h}px` }} />
        ))}
      </div>
    </Card>
  );
}
