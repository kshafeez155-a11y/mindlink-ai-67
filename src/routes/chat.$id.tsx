import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card } from "@/components/ui/primitives";
import { getCharacter, sampleConversation, suggestedQuestions } from "@/data/mock";

export const Route = createFileRoute("/chat/$id")({ component: ChatPage });

function ChatPage() {
  const { id } = Route.useParams();
  const character = getCharacter(id);
  const [messages, setMessages] = useState(sampleConversation);
  const [draft, setDraft] = useState("");
  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", text, time: "Now" },
      {
        role: "ai",
        text: `That's a thoughtful question. I'd start by breaking it into a small experiment, then reviewing what you learn before making the next decision.`,
        time: "Now",
      },
    ]);
    setDraft("");
  };
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="flex min-h-[calc(100vh-12rem)] flex-col">
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <Link
              to="/character/$id"
              params={{ id: character.id }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
              aria-label="Back to profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img
              src={character.photo}
              alt={character.creatorName}
              className="h-11 w-11 rounded-xl object-cover object-top"
            />
            <div>
              <h1 className="font-bold">Chat with {character.characterName}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {character.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI character based on {character.creatorName}'s approved knowledge.
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-5 py-6">
            {messages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-white sm:max-w-[70%]"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm sm:max-w-[70%]"
                }
              >
                <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                <p
                  className={`mt-2 text-[11px] ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {message.time}
                </p>
              </div>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex gap-2 border-t border-border pt-4"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Ask ${character.characterName} anything...`}
              className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <Button size="icon" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </main>
        <aside>
          <Card className="p-5">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Try asking
            </p>
            <div className="mt-4 space-y-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => send(question)}
                  className="w-full rounded-xl border border-border px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </SiteLayout>
  );
}
