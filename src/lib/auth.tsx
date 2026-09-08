import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type User = { name: string; email: string; role: "audience" | "creator" };

type AuthValue = {
  user: User | null;
  signIn: (user?: Partial<User>) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue>({ user: null, signIn: () => {}, signOut: () => {} });

const STORAGE_KEY = "mindlink.mock-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const signIn = useCallback((partial?: Partial<User>) => {
    const next: User = {
      name: partial?.name || "Rahul Sharma",
      email: partial?.email || "rahul@mindlink.app",
      role: partial?.role || "creator",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
