import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Chrome, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card, Field } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { error, loading, sendMagicLink, signInWithGoogle, user, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/explore" });
  }, [navigate, user]);

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    clearError();
    setSubmitting(true);
    const result = await sendMagicLink(email);
    setSubmitting(false);
    if (!result.error) setMessage("Check your email for a secure sign-in link.");
  };

  const handleGoogle = async () => {
    setMessage(null);
    clearError();
    setSubmitting(true);
    const result = await signInWithGoogle();
    if (result.error) setSubmitting(false);
  };
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <Card className="p-6 sm:p-8">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with a secure email link.</p>
          <form className="mt-7 space-y-5" onSubmit={handleMagicLink}>
            <Field
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-success-soft px-3 py-2 text-sm text-success">{message}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? "Sending link..." : "Send magic link"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={() => void handleGoogle()}
            disabled={submitting || loading}
          >
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to MindLink?{" "}
            <Link to="/signup" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
