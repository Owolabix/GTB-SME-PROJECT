import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthBackButton } from "@/components/site/AuthBackButton";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession, isBrowserAuthContext } from "@/lib/authSession";
import { getPostAuthPath } from "@/lib/postAuthRedirect";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_MIN_LENGTH_HINT,
  validatePassword,
} from "@/lib/passwordPolicy";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Lynk Assistant" },
      {
        name: "description",
        content: "Create an Lynk Assistant account to automate Instagram comments and DMs.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (!isBrowserAuthContext()) return;
    const session = await getClientSession();
    if (session?.user) {
      throw redirect({ to: await getPostAuthPath(session.user.id) });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [confirmedGtco, setConfirmedGtco] = useState(false);
  const [requiresAccessCode, setRequiresAccessCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/verify-signup-eligibility")
      .then((res) => res.json())
      .then((data: { requiresAccessCode?: boolean }) => {
        setRequiresAccessCode(Boolean(data.requiresAccessCode));
      })
      .catch(() => {
        setRequiresAccessCode(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
    const eligibilityRes = await fetch("/api/auth/verify-signup-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        accessCode: accessCode.trim() || undefined,
        confirmedGtcoCustomer: confirmedGtco,
      }),
    });
    const eligibility = (await eligibilityRes.json()) as { ok?: boolean; message?: string };
    if (!eligibilityRes.ok || !eligibility.ok) {
      setLoading(false);
      setError(eligibility.message ?? "You are not eligible to sign up for Lynk Assistant.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: origin ? { emailRedirectTo: `${origin}/login` } : undefined,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
      setSuccess("Account created. Log in to set up your store and connect Instagram.");
      return;
    }

    setSuccess(
      "Account created. Check your inbox to confirm your email, then log in.",
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16 md:py-24">
        <AuthBackButton />
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:p-10">
          <div className="flex items-center gap-3 text-sm font-medium text-primary">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
              <UserPlus className="h-4 w-4" />
            </span>
            Create your account
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">Sign up for Lynk Assistant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            For GTCO SME merchant customers. Comment and DM automations for your Instagram — set up in
            minutes after you register.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="signup-email">Business email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={PASSWORD_MIN_LENGTH_HINT}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <PasswordInput
                id="signup-confirm"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signup-access-code">
                GTCO access code{requiresAccessCode ? "" : " (if provided)"}
              </Label>
              <Input
                id="signup-access-code"
                type="text"
                autoComplete="off"
                required={requiresAccessCode}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder={
                  requiresAccessCode
                    ? "Required — from your GTCO relationship manager"
                    : "Optional — only if your bank gave you a code"
                }
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Checkbox
                id="signup-gtco-confirm"
                checked={confirmedGtco}
                onCheckedChange={(checked) => setConfirmedGtco(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="signup-gtco-confirm" className="cursor-pointer text-sm font-normal leading-snug">
                I confirm I am a GTCO SME merchant customer enrolling in Lynk Assistant.
              </Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-muted-foreground">{success}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
