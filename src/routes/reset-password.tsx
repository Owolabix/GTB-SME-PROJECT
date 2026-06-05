import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthBackButton } from "@/components/site/AuthBackButton";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession, isBrowserAuthContext } from "@/lib/authSession";
import { getPostAuthPath } from "@/lib/postAuthRedirect";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_MIN_LENGTH_HINT,
  validatePassword,
} from "@/lib/passwordPolicy";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — Lynk Assistant" },
      {
        name: "description",
        content: "Choose a new password for your Lynk Assistant account.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (!isBrowserAuthContext()) return;
    const session = await getClientSession();
    if (!session?.user) return;

    const isRecoveryLink =
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery");

    if (!isRecoveryLink) {
      throw redirect({ to: await getPostAuthPath(session.user.id) });
    }
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionData.session) {
        setLinkValid(true);
        setCheckingLink(false);
        return;
      }

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "PASSWORD_RECOVERY" || session) {
          setLinkValid(true);
          setCheckingLink(false);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();

    const timer = window.setTimeout(() => {
      if (!cancelled) setCheckingLink(false);
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    const { data: userData } = await supabase.auth.getUser();
    const dest = userData.user ? await getPostAuthPath(userData.user.id) : "/dashboard";
    setTimeout(() => navigate({ to: dest }), 1500);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16 md:py-24">
        <AuthBackButton />
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:p-10">
          <div className="flex items-center gap-3 text-sm font-medium text-primary">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
              <KeyRound className="h-4 w-4" />
            </span>
            New password
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">Choose a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick something secure you haven&apos;t used on Lynk Assistant before.
          </p>

          {checkingLink ? (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !linkValid ? (
            <div className="mt-8 space-y-4">
              <p className="text-sm text-destructive">
                This reset link is invalid or has expired. Request a new one from the forgot password page.
              </p>
              <Button asChild className="w-full rounded-full bg-[image:var(--gradient-primary)]">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
            </div>
          ) : success ? (
            <p className="mt-8 text-sm text-muted-foreground">
              Password updated. Taking you to your dashboard…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reset-password">New password</Label>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={PASSWORD_MIN_LENGTH_HINT}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reset-confirm">Confirm password</Label>
                <PasswordInput
                  id="reset-confirm"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Update password <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to log in <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
