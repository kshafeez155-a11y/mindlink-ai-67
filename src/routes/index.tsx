import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, MessageSquare, Play, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { CharacterCard } from "@/components/CharacterCard";
import { Button, Card, Pill, SectionHeading } from "@/components/ui/primitives";
import { categories, characters, howItWorks, platformStats } from "@/data/mock";
import rahul from "@/assets/creator-rahul.jpg";
import priya from "@/assets/creator-priya.jpg";
import alex from "@/assets/creator-alex.jpg";
import sneha from "@/assets/creator-sneha.jpg";

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
        content: "An AI-powered personal-brand interaction marketplace. Chat or talk with expert AI characters.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [category, setCategory] = useState("All");
  const filtered =
    category === "All" ? characters : characters.filter((c) => c.category === category);

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
                alt="Rahul Sharma, entrepreneur and investor"
                width={640}
                height={640}
                className="aspect-square w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/85 to-transparent p-5 pt-16">
                <p className="text-sm font-semibold text-white">Rahul AI</p>
                <p className="text-xs text-white/70">by Rahul Sharma · Entrepreneur & Investor</p>
              </div>
            </div>

            <div className="absolute -left-4 top-10 hidden animate-float-soft sm:block">
              <FloatCard img={priya} name="Priya AI" role="Marketing" />
            </div>
            <div
              className="absolute -right-5 top-28 hidden animate-float-soft sm:block"
              style={{ animationDelay: "1.4s" }}
            >
              <FloatCard img={alex} name="Alex AI" role="Fitness" />
            </div>
            <div
              className="absolute -left-6 bottom-16 hidden animate-float-soft sm:block"
              style={{ animationDelay: "2.6s" }}
            >
              <FloatCard img={sneha} name="Dr. Sneha AI" role="Wellness" />
            </div>

            <div className="absolute -bottom-5 right-2 max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-card p-3.5 shadow-lift sm:right-6">
              <p className="flex items-center gap-2 text-xs font-semibold text-primary-deep">
                <MessageSquare className="h-3.5 w-3.5" /> Rahul AI
              </p>
              <p className="mt-1.5 text-sm">Hi, I'm Rahul's AI. Ask me anything.</p>
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
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Pill key={c} active={c === category} onClick={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No characters in this category yet — try another one.
          </p>
        ) : null}

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
              Turn your expertise into a <span className="text-gradient-brand">24/7 AI character.</span>
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

function FloatCard({ img, name, role }: { img: string; name: string; role: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5 pr-4 shadow-lift">
      <img src={img} alt={name} loading="lazy" className="h-10 w-10 rounded-xl object-cover object-top" />
      <div>
        <p className="text-xs font-semibold">{name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>
    </div>
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
