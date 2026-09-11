import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AccountType = "creator" | "user";
type AuthDestination = "/creator/onboarding" | "/creator/dashboard" | "/explore";

function isAccountType(value: unknown): value is AccountType {
  return value === "creator" || value === "user";
}

export function authCallbackUrl(accountType?: AccountType) {
  const url = new URL("/login", window.location.origin);
  if (isAccountType(accountType)) {
    url.searchParams.set("signup_type", accountType);
    url.searchParams.set("signup_started", String(Date.now()));
  }
  return url.toString();
}

// Called only by the login entry/callback page, never by token-refresh events.
export async function resolveAuthDestination(
  userId: string,
  search: string,
): Promise<AuthDestination> {
  if (!supabase) throw new Error("Authentication is not configured.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || authData.user?.id !== userId) {
    throw new Error("Your session could not be verified. Please sign in again.");
  }
  const user = authData.user;
  const params = new URLSearchParams(search);
  const intent = params.get("signup_type");
  const started = Number(params.get("signup_started"));
  const created = Date.parse(user.created_at);
  // An existing account predates this signup attempt. A completion marker also
  // prevents a replayed callback from reinitializing an already resolved account.
  const newSignup =
    isAccountType(intent) &&
    Number.isFinite(started) &&
    started > 0 &&
    created >= started &&
    created <= Date.now() &&
    Date.now() - started <= 86_400_000 &&
    user.user_metadata?.["mindlink_signup_completed"] !== true;

  let profile: { account_type: string | null } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error("We couldn't load your account information. Please retry.");
    profile = data;
    if (profile) break;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!profile) {
    throw new Error(
      "Your profile is not available yet. Please retry. If this continues, contact support to check account setup.",
    );
  }
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (creatorError) throw new Error("We couldn't check your creator account. Please retry.");
  if (creator) return "/creator/dashboard";
  if (profile.account_type === "creator") return "/creator/onboarding";

  if (newSignup) {
    // Reuse the existing own-profile UPDATE mechanism; never assume a row was saved.
    let update = supabase.from("profiles").update({ account_type: intent }).eq("id", userId);
    update =
      profile.account_type === null
        ? update.is("account_type", null)
        : update.eq("account_type", profile.account_type);
    const { data: saved, error: saveError } = await update.select("account_type").single();
    if (saveError || saved?.account_type !== intent) {
      throw new Error("We couldn't save your account choice. Please retry or contact support.");
    }
    const { error: markerError } = await supabase.auth.updateUser({
      data: { mindlink_signup_completed: true },
    });
    if (markerError)
      throw new Error("Your account choice was saved, but setup could not finish. Please retry.");
    return intent === "creator" ? "/creator/onboarding" : "/explore";
  }
  if (profile.account_type === "user") return "/explore";
  throw new Error(
    "Your account type could not be determined. Please contact support to complete account setup.",
  );
}

type AuthValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  sendMagicLink: (email: string, accountType?: AccountType) => Promise<{ error: string | null }>;
  signInWithGoogle: (accountType?: AccountType) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  clearError: () => void;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  loading: true,
  error: null,
  sendMagicLink: async () => ({ error: "Authentication is not available yet." }),
  signInWithGoogle: async () => ({ error: "Authentication is not available yet." }),
  signOut: async () => ({ error: "Authentication is not available yet." }),
  clearError: () => undefined,
});

function friendlyAuthError(message: string) {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (message.toLowerCase().includes("provider is not enabled")) {
    return "This sign-in option is not enabled yet. Check your Supabase Auth settings.";
  }
  return "We couldn't complete that request. Please check your details and try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (sessionError) setError(friendlyAuthError(sessionError.message));
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email: string, accountType?: AccountType) => {
    if (!supabase || !isSupabaseConfigured) {
      const message = "Add your Supabase project URL and public key to .env to continue.";
      setError(message);
      return { error: message };
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authCallbackUrl(accountType) },
    });
    const message = authError ? friendlyAuthError(authError.message) : null;
    setError(message);
    return { error: message };
  }, []);

  const signInWithGoogle = useCallback(async (accountType?: AccountType) => {
    if (!supabase || !isSupabaseConfigured) {
      const message = "Add your Supabase project URL and public key to .env to continue.";
      setError(message);
      return { error: message };
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl(accountType) },
    });
    const message = authError ? friendlyAuthError(authError.message) : null;
    setError(message);
    return { error: message };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return { error: null };
    const { error: authError } = await supabase.auth.signOut();
    const message = authError ? friendlyAuthError(authError.message) : null;
    setError(message);
    return { error: message };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      sendMagicLink,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [user, loading, error, sendMagicLink, signInWithGoogle, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
