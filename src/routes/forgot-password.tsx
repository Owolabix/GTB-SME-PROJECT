import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AuthBackButton } from "@/components/site/AuthBackButton";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession, isBrowserAuthContext } from "@/lib/authSession";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Lynk Assistant" },
      {
        name: "description",
        content: "Reset your Lynk Assistant password via email.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (!isBrowserAuthContext()) return;
    const session = await getClientSession();
    if (session?.user) throw redirect({ to: "/dashboard" });
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
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
            Reset password
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the email you used to sign up. We&apos;ll send a link to choose a new password.
          </p>

          {sent ? (
            <div className="mt-8 space-y-4">
              <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                If an account exists for <span className="font-medium">{email.trim()}</span>, check your inbox
                for a reset link. It may take a minute to arrive.
              </p>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/login">Back to log in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
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
                    Send reset link <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
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
