import { Link } from "@tanstack/react-router";
import { MessageSquare, Phone } from "lucide-react";
import type { Character } from "@/data/mock";
import { Button, StatusIndicator } from "@/components/ui/primitives";

export function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/character/$id"
        params={{ id: character.id }}
        className="relative block aspect-4/3 overflow-hidden bg-secondary"
      >
        <img
          src={character.photo}
          alt={character.creatorName}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-primary-deep backdrop-blur">
          {character.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/character/$id"
              params={{ id: character.id }}
              className="block truncate font-semibold hover:text-primary"
            >
              {character.characterName}
            </Link>
            <p className="truncate text-xs text-muted-foreground">by {character.creatorName}</p>
          </div>
          <StatusIndicator online={character.online} />
        </div>

        <p className="mt-1.5 text-sm font-medium text-primary-deep">{character.title}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{character.description}</p>

      </div>


      <div className="flex gap-2 border-t border-border p-4 pt-3">
        <Link to="/chat/$id" params={{ id: character.id }} className="flex-1">
          <Button size="sm" className="w-full">
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
        </Link>
        <Link to="/voice/$id" params={{ id: character.id }} className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            <Phone className="h-4 w-4" /> Voice
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function CreatorRow({ character }: { character: Character }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:flex sm:justify-between">
      <Link to="/character/$id" params={{ id: character.id }} className="shrink-0">
        <img
          src={character.photo}
          alt={character.creatorName}
          loading="lazy"
          className="h-14 w-14 rounded-full object-cover object-top"
        />
      </Link>
      <div className="min-w-0 sm:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/character/$id"
            params={{ id: character.id }}
            className="truncate font-semibold hover:text-primary"
          >
            {character.creatorName}
          </Link>
          <StatusIndicator online={character.online} />
        </div>
        <p className="text-sm font-medium text-primary-deep">{character.title}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{character.description}</p>
      </div>
      <div className="col-span-2 flex gap-2 sm:col-auto sm:shrink-0">
        <Link to="/chat/$id" params={{ id: character.id }} className="flex-1 sm:flex-none">
          <Button size="sm" className="w-full">
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
        </Link>
        <Link to="/voice/$id" params={{ id: character.id }} className="flex-1 sm:flex-none">
          <Button size="sm" variant="outline" className="w-full">
            <Phone className="h-4 w-4" /> Voice
          </Button>
        </Link>
      </div>
    </div>
  );
}
