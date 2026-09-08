import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mic, PhoneOff, ShieldCheck, Volume2 } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card } from "@/components/ui/primitives";
import { getCharacter } from "@/data/mock";

export const Route = createFileRoute("/voice/$id")({ component: VoicePage });

function VoicePage() {
  const { id } = Route.useParams();
  const character = getCharacter(id);
  const [active, setActive] = useState(false);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          to="/character/$id"
          params={{ id: character.id }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <Card className="mt-6 overflow-hidden p-0">
          <div className="bg-navy px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div className="relative mx-auto w-fit">
              {active ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              ) : null}
              <img
                src={character.photo}
                alt={character.creatorName}
                className="relative h-28 w-28 rounded-full border-4 border-white/20 object-cover object-top shadow-lift sm:h-36 sm:w-36"
              />
            </div>
            <p className="mt-6 text-sm text-white/70">
              {active ? "Listening now" : "AI Voice Conversation"}
            </p>
            <h1 className="mt-1 text-2xl font-bold">Talk to {character.characterName}</h1>
            <p className="mt-2 text-sm text-white/70">{character.title}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button
                size="lg"
                variant={active ? "danger" : "primary"}
                onClick={() => setActive((value) => !value)}
              >
                {active ? (
                  <>
                    <PhoneOff className="h-4 w-4" /> End Conversation
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Start Conversation
                  </>
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                aria-label="Toggle speaker"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">A safe, transparent conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is an AI voice experience based on {character.creatorName}'s approved
                  knowledge. It is not the real person.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </SiteLayout>
  );
}
