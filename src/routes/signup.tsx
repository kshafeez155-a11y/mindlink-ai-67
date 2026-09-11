import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Chrome, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card, Field } from "@/components/ui/primitives";
import { useAuth, type AccountType } from "@/lib/auth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { error, loading, sendMagicLink, signInWithGoogle, clearError, user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && userId) void navigate({ to: "/login", replace: true });
  }, [loading, userId, navigate]);

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountType || submitting || userId) return;
    setMessage(null);
    clearError();
    setSubmitting(true);
    const result = await sendMagicLink(email, accountType);
    setSubmitting(false);
    if (!result.error) setMessage("Check your email to finish creating your account.");
  };

  const handleGoogle = async () => {
    if (!accountType || submitting || userId) return;
    setMessage(null);
    clearError();
    setSubmitting(true);
    const result = await signInWithGoogle(accountType);
    if (result.error) setSubmitting(false);
  };
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <Card className="p-6 sm:p-8">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Start with MindLink</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account with a secure email link.
          </p>
          <fieldset className="mt-6 space-y-3" disabled={submitting || loading || !!userId}>
            <legend className="mb-3 text-sm font-semibold">
              How would you like to use MindLink?
            </legend>
            {(
              [
                ["creator", "Creator", "Create an AI version of your knowledge and expertise."],
                ["user", "Audience", "Discover and chat with AI characters."],
              ] as const
            ).map(([value, label, description]) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${accountType === value ? "border-primary bg-primary-soft" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={value}
                  checked={accountType === value}
                  onChange={() => setAccountType(value)}
                  className="mt-1 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
          </fieldset>
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
            <Button
              className="w-full"
              type="submit"
              disabled={submitting || loading || !accountType || !!userId}
            >
              {submitting ? "Sending link..." : "Get Started"} <ArrowRight className="h-4 w-4" />
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
            disabled={submitting || loading || !accountType || !!userId}
          >
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
