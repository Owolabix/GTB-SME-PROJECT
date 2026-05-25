import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  META_OAUTH_LOGIN_FLAG,
  metaOAuthParamsFromSearch,
  type MetaOAuthLoginSearch,
} from "@/lib/metaOAuthResume";
import { finishMetaInstagramConnect } from "@/lib/finishMetaInstagramConnect";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession, isBrowserAuthContext } from "@/lib/authSession";

const loginSearchSchema = z.object({
  oauth: z.literal(META_OAUTH_LOGIN_FLAG).optional(),
  code: z.string().optional(),
  state: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (raw) =>
    loginSearchSchema.parse(typeof raw === "object" && raw !== null ? raw : {}),
  head: () => ({
    meta: [
      { title: "Log in — Lynk Assistant" },
      {
        name: "description",
        content: "Sign in to Lynk Assistant to manage Instagram DM automations.",
      },
    ],
  }),
  beforeLoad: async ({ search }) => {
    if (!isBrowserAuthContext()) return;

    const session = await getClientSession();
    const user = session?.user;
    const meta = metaOAuthParamsFromSearch(search as MetaOAuthLoginSearch);
    if (user && meta) {
      throw redirect({
        to: "/integrations",
        search: { code: meta.code, state: meta.state },
      });
    }
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const metaPending = metaOAuthParamsFromSearch(search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoResuming, setAutoResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoResumeAttempted = useRef(false);

  const metaCode = metaPending?.code;
  const metaState = metaPending?.state;

  useEffect(() => {
    if (!metaCode || !metaState || autoResumeAttempted.current) return;

    let cancelled = false;

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled || !sessionData.session?.access_token) return;

      autoResumeAttempted.current = true;
      setAutoResuming(true);
      setError(null);

      const result = await finishMetaInstagramConnect(metaCode, metaState);
      if (cancelled) return;

      setAutoResuming(false);
      if (!result.ok) {
        setError(result.message);
        autoResumeAttempted.current = false;
        return;
      }

      sessionStorage.setItem("instagram_connected", "1");
      navigate({ to: "/integrations", replace: true, search: {} });
    })();

    return () => {
      cancelled = true;
    };
  }, [metaCode, metaState, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setLoading(false);
      setError("Signed in, but session did not load. Refresh and try again.");
      return;
    }

    if (metaPending) {
      const result = await finishMetaInstagramConnect(metaPending.code, metaPending.state);
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      sessionStorage.setItem("instagram_connected", "1");
      navigate({ to: "/integrations", replace: true, search: {} });
      return;
    }

    setLoading(false);
    navigate({ to: "/onboarding" });
  }

  const signupSearch = metaPending
    ? { oauth: META_OAUTH_LOGIN_FLAG, code: metaPending.code, state: metaPending.state }
    : {};

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:p-10">
          <div className="flex items-center gap-3 text-sm font-medium text-primary">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
              <LogIn className="h-4 w-4" />
            </span>
            Welcome back
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">Log in to your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the email and password you registered with.
          </p>
          {metaPending && (
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {autoResuming
                ? "You're still signed in — finishing your Instagram connection now (do not refresh this page)."
                : "You returned from Meta. If you're already signed in, we'll connect Instagram automatically. Otherwise sign in below (do not refresh this page)."}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={loading || autoResuming}
              className="w-full rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
            >
              {loading || autoResuming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {autoResuming ? "Finishing Instagram link…" : "Signing in…"}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> {metaPending ? "Log in & finish Instagram link" : "Log in"}
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link to="/signup" search={signupSearch} className="font-medium text-primary hover:underline">
              Sign up <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
