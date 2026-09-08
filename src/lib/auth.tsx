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

type AuthValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
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

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      const message = "Add your Supabase project URL and public key to .env to continue.";
      setError(message);
      return { error: message };
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/login" },
    });
    const message = authError ? friendlyAuthError(authError.message) : null;
    setError(message);
    return { error: message };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      const message = "Add your Supabase project URL and public key to .env to continue.";
      setError(message);
      return { error: message };
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/explore" },
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
