import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CharacterCard, type MarketplaceCharacter } from "@/components/CharacterCard";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore AI Characters — MindLink" },
      {
        name: "description",
        content: "Find published AI characters built from real creator expertise.",
      },
      { property: "og:title", content: "Explore AI Characters — MindLink" },
      { property: "og:description", content: "Browse published AI characters on MindLink." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacters = async () => {
      if (!supabase) {
        setError("Characters are not available right now.");
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("characters")
        .select("id, name, tagline, description, avatar_url, status, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (queryError) {
        setError("We couldn't load published characters. Please try again.");
      } else {
        setCharacters((data ?? []) as MarketplaceCharacter[]);
      }
      setLoading(false);
    };

    void loadCharacters();
    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return characters;
    return characters.filter((character) =>
      [character.name, character.tagline, character.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [characters, query]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Explore AI Characters</h1>
        <p className="mt-2 text-muted-foreground">
          Find published AI characters built from real expertise.
        </p>

        <div className="relative mt-7">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, tagline, or description..."
            className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">Loading characters...</p>
        ) : error ? (
          <div className="mt-16 rounded-2xl border border-destructive/25 bg-destructive/5 py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-semibold">
              {characters.length === 0 ? "No published characters yet" : "No characters found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {characters.length === 0
                ? "Published characters will appear here when they are ready."
                : "Try a different search."}
            </p>
            {query ? (
              <Button variant="outline" size="sm" className="mt-5" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mt-12 flex items-center justify-between">
              <h2 className="text-xl font-bold">Published characters</h2>
              <span className="text-sm text-muted-foreground">{results.length} characters</span>
            </div>
            <div className="mt-5 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
