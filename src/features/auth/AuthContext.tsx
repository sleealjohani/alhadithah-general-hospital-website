import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";
import type { AdminRole, Profile } from "../../types";

export type AuthStatus = "loading" | "authenticated" | "no-profile" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  hasRole: (allowed: AdminRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const hydrate = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }
    const nextProfile = await loadProfile(nextSession.user.id);
    if (!nextProfile || nextProfile.status !== "active") {
      setProfile(null);
      setStatus("no-profile");
      return;
    }
    setProfile(nextProfile);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus("unauthenticated");
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) hydrate(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) hydrate(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: { name: "ConfigError", message: "Supabase is not configured." } as AuthError };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const hasRole = useCallback(
    (allowed: AdminRole[]) => Boolean(profile && allowed.includes(profile.role)),
    [profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, profile, signIn, signOut, hasRole }),
    [status, session, profile, signIn, signOut, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
