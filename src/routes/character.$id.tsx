import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Linkedin, MessageSquare, Phone, ShieldCheck, Star, Twitter, Youtube } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card, Tabs, Tag } from "@/components/ui/primitives";
import { getCharacter } from "@/data/mock";
import cover from "@/assets/cover-banner.jpg";

export const Route = createFileRoute("/character/$id")({
  head: ({ params }) => {
    const c = getCharacter(params.id);
    return {
      meta: [
        { title: `${c.characterName} by ${c.creatorName} — MindLink` },
        { name: "description", content: c.description },
        { property: "og:title", content: `${c.characterName} — ${c.title}` },
        { property: "og:description", content: c.description },
      ],
    };
  },
  component: Profile,
});

const socialIcons: Record<string, typeof Youtube> = {
  YouTube: Youtube,
  LinkedIn: Linkedin,
  Instagram: Instagram,
  "X (Twitter)": Twitter,
};

function Profile() {
  const { id } = Route.useParams();
  const character = getCharacter(id);
  const [tab, setTab] = useState("About");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* HEADER CARD */}
        <Card className="overflow-hidden p-0">
          <div className="relative h-40 sm:h-56">
            <img src={cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-navy/70 via-navy/30 to-transparent" />
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
              <img
                src={character.photo}
                alt={character.creatorName}
                width={640}
                height={640}
                className="h-28 w-28 shrink-0 rounded-3xl border-4 border-card object-cover object-top shadow-lift sm:h-36 sm:w-36"
              />
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{character.characterName}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> AI Character Online
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">by {character.creatorName}</p>
                <p className="mt-1 font-medium text-primary-deep">{character.title}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {character.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>

            <p className="mt-5 max-w-2xl text-muted-foreground">"{character.description}"</p>

            <div className="mt-6 flex flex-wrap gap-8 border-t border-border pt-6">
              <Stat value={character.followers} label="Followers" />
              <Stat value={character.conversations} label="Conversations" />
              <div>
                <p className="flex items-center gap-1.5 text-2xl font-bold">
                  {character.rating}
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/chat/$id" params={{ id: character.id }} className="sm:flex-1">
                <Button size="lg" className="w-full">
                  <MessageSquare className="h-4.5 w-4.5" /> Start Chat
                </Button>
              </Link>
              <Link to="/voice/$id" params={{ id: character.id }} className="sm:flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  <Phone className="h-4.5 w-4.5" /> Talk to {character.creatorName.split(" ")[0]}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* BODY */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="p-5 sm:p-7">
            <Tabs tabs={["About", "Popular Questions", "Reviews"]} active={tab} onChange={setTab} />

            {tab === "About" ? (
              <div className="pt-6">
                <p className="text-muted-foreground">{character.about}</p>
                <h3 className="mt-8 text-lg font-semibold">Popular questions</h3>
                <div className="mt-4 grid gap-3">
                  {character.popularQuestions.map((q) => (
                    <Link key={q} to="/chat/$id" params={{ id: character.id }}>
                      <div className="rounded-xl border border-border px-4 py-3.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft">
                        {q}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "Popular Questions" ? (
              <div className="grid gap-3 pt-6">
                {character.popularQuestions.map((q) => (
                  <Link key={q} to="/chat/$id" params={{ id: character.id }}>
                    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft">
                      {q}
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {tab === "Reviews" ? (
              <div className="space-y-4 pt-6">
                {[
                  { name: "Meera R.", text: "Felt like a real coaching session. Practical and direct.", stars: 5 },
                  { name: "Dev P.", text: "Answered at 2am when I needed it. Genuinely useful.", stars: 5 },
                  { name: "Sana M.", text: "Great for quick questions, still book the real call for depth.", stars: 4 },
                ].map((r) => (
                  <div key={r.name} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <p className="font-semibold">Connect with {character.creatorName.split(" ")[0]}</p>
              <div className="mt-4 space-y-2">
                {character.socials.map((s) => {
                  const Icon = socialIcons[s.label] ?? Youtube;
                  return (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{s.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{s.handle}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-primary/25 bg-primary-soft p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
                <ShieldCheck className="h-4 w-4" /> About this AI character
              </p>
              <p className="mt-2 text-sm text-primary-deep/80">
                This is an AI character based on {character.creatorName.split(" ")[0]}'s approved
                knowledge and communication guidelines. It is not the real person.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
