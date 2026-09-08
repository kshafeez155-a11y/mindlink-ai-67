import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Compass,
  Grid3x3,
  Home,
  Search,
  Settings,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { DashShell, type NavItem } from "@/components/DashShell";
import { CharacterCard, CreatorRow } from "@/components/CharacterCard";
import { Button, Pill } from "@/components/ui/primitives";
import { categories, characters } from "@/data/mock";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore AI Characters — MindLink" },
      {
        name: "description",
        content: "Find your favorite creators, experts and thought leaders and start a chat or voice conversation.",
      },
      { property: "og:title", content: "Explore AI Characters — MindLink" },
      { property: "og:description", content: "Browse trending and featured AI characters across every category." },
    ],
  }),
  component: Explore,
});

const sorts = ["Trending", "Popular", "New", "Most conversations"] as const;

function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Trending");
  const [section, setSection] = useState("Explore");

  const nav: NavItem[] = [
    { label: "Home", icon: Home, to: "/" },
    { label: "Explore", icon: Compass, active: section === "Explore", onClick: () => setSection("Explore") },
    { label: "Trending", icon: TrendingUp, active: section === "Trending", onClick: () => setSection("Trending") },
    { label: "Following", icon: UserPlus, active: section === "Following", onClick: () => setSection("Following") },
    { label: "Categories", icon: Grid3x3, active: section === "Categories", onClick: () => setSection("Categories") },
    { label: "Saved", icon: Bookmark, active: section === "Saved", onClick: () => setSection("Saved") },
    { label: "Settings", icon: Settings, to: "/creator/settings" },
  ];

  const results = useMemo(() => {
    let list = characters.filter((c) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        [c.creatorName, c.characterName, c.title, c.category, c.description, ...c.tags]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesCategory = category === "All" || c.category === category;
      return matchesQuery && matchesCategory;
    });

    if (section === "Following") list = list.filter((c) => c.online);
    if (section === "Saved") list = list.slice(0, 2);

    const sorted = [...list];
    if (sort === "Trending") sorted.sort((a, b) => b.trending - a.trending);
    if (sort === "Popular") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "New") sorted.sort((a, b) => a.newest - b.newest);
    if (sort === "Most conversations")
      sorted.sort((a, b) => parseFloat(b.conversations) - parseFloat(a.conversations));
    return sorted;
  }, [query, category, sort, section]);

  const trending = results.slice(0, 3);
  const featured = results.slice(0, 4);

  return (
    <DashShell items={nav}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Explore AI Characters</h1>
        <p className="mt-2 text-muted-foreground">
          Find your favorite creators, experts and thought leaders.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for creators, topics or expertise..."
              className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
            className="h-12 rounded-xl border border-input bg-card px-4 text-sm font-medium focus:border-primary focus:outline-none"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Pill key={c} active={c === category} onClick={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-semibold">No characters found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-12 flex items-center justify-between">
              <h2 className="text-xl font-bold">{section === "Saved" ? "Saved" : "Trending Now"}</h2>
              <span className="text-sm text-muted-foreground">{results.length} characters</span>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>

            <h2 className="mt-14 text-xl font-bold">Featured Creators</h2>
            <div className="mt-5 space-y-3">
              {featured.map((c) => (
                <CreatorRow key={c.id} character={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashShell>
  );
}
