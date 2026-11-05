import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  /** false until the browser has checked for a saved session */
  ready: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  name: string;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProfile = async (s: Session | null) => {
    if (!s) {
      setName("");
      setIsAdmin(false);
      return;
    }
    const uid = s.user.id;
    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const meta = (s.user.user_metadata?.["full_name"] as string | undefined) ?? "";
    setName(profile.data?.full_name || meta || s.user.email?.split("@")[0] || "Citizen");
    setIsAdmin(!!roles.data?.some((r) => r.role === "admin"));
  };

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (alive) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer DB calls out of the auth callback (recommended by Supabase).
      setTimeout(() => {
        void loadProfile(s).then(() => setReady(true));
      }, 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    ready,
    session,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    name,
    isAdmin,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: () => loadProfile(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
