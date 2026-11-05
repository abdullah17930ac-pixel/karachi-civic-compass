import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const SAFE_REDIRECTS = ["/", "/dashboard", "/report", "/track", "/admin"] as const;
type Redirect = (typeof SAFE_REDIRECTS)[number];

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: Redirect | undefined } => ({
    redirect: SAFE_REDIRECTS.includes(s["redirect"] as Redirect)
      ? (s["redirect"] as Redirect)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in – CivicConnect Karachi" },
      {
        name: "description",
        content: "Sign in or create a CivicConnect account to report and track civic issues.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { session, ready } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const goNext = () => navigate({ to: redirect ?? "/dashboard" });

  useEffect(() => {
    if (ready && session) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && name.trim().length < 2) return setError("Please tell us your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("That email doesn't look quite right.");
    if (password.length < 6) return setError("Your password needs at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Welcome back! 👋");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim(), phone: phone.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Almost there! Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        toast.success(`Welcome to CivicConnect, ${name.trim().split(" ")[0]}! 🎉`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        /invalid login/i.test(msg)
          ? "Email or password is incorrect. Please try again."
          : /already registered/i.test(msg)
            ? "This email already has an account. Try signing in instead."
            : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-hero">
      <div className="container-page flex justify-center py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-7 shadow-elevated sm:p-9"
        >
          <h1 className="font-display text-3xl font-bold text-navy">
            {mode === "signin" ? "Welcome back 👋" : "Join your neighbours 🤝"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {redirect === "/report"
              ? "Sign in first so we can keep you updated on your complaint."
              : mode === "signin"
                ? "Sign in to report issues and follow them until they're fixed."
                : "Create a free account. It takes less than a minute."}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={cn(
                  "rounded-lg py-2 transition-all",
                  mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                )}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="mt-1.5 h-11"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03xx xxxxxxx"
                    className="mt-1.5 h-11"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 h-11"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 h-11"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
              >
                {error}
              </motion.p>
            )}
            <Button type="submit" variant="brand" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : mode === "signin" ? (
                <LogIn />
              ) : (
                <UserPlus />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Just want to check a complaint?{" "}
            <Link to="/track" className="font-semibold text-brand hover:underline">
              Track by ID, no account needed
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
