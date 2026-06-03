import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { completeInstagramConnect, startInstagramConnect } from "@/integrations/instagram/connectInstagram";
import { buildMetaOAuthUrlForInstagram } from "@/integrations/instagram/oauthUrl";
import { getMetaOAuthRedirectUri } from "@/integrations/instagram/metaRedirectUri";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  clearIntegrationsReturnToOnboarding,
  isOnboardingReturnSearch,
  markIntegrationsReturnToOnboarding,
  shouldReturnToOnboardingAfterIntegrations,
} from "@/lib/onboardingIntegrationsReturn";
import { ArrowRight, Instagram, Loader2, Plug, CheckCircle2, Trash2 } from "lucide-react";

const integrationsSearchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  /** Set when merchant arrives from onboarding to connect Instagram first. */
  returnTo: z.literal("onboarding").optional(),
  /** Meta redirects here when Login fails (e.g. app in Development mode, user not on app roles). */
  error: z.string().optional(),
  error_description: z.string().optional(),
  error_reason: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/integrations")({
  validateSearch: (raw) =>
    integrationsSearchSchema.parse(typeof raw === "object" && raw !== null ? raw : {}),
  head: () => ({ meta: [{ title: "Lynk Assistant — Integrations" }] }),
  component: IntegrationsPage,
});

type IgAccount = { id: string; username: string; ig_user_id: string; connected_at: string };

/** Prevents duplicate Meta code exchange (e.g. React dev remounts) — OAuth codes are single-use. */
const metaOAuthCodesInFlight = new Set<string>();

function safeDecodeOAuthParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Query `error_description` often uses `+` for spaces (application/x-www-form-urlencoded). */
function decodeOAuthErrorDescription(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value.replace(/\+/g, " ");
  }
}

const MERCHANT_META_UNAVAILABLE_HINT =
  "We couldn't connect Instagram because Facebook login is temporarily unavailable. Please try again in a little while. If it keeps failing, contact support.";

const MERCHANT_META_ACCESS_HINT =
  "We couldn't connect Instagram with this Facebook account. Use the Facebook login that manages your Instagram business or creator profile, then try again. If it still fails, contact support.";

const DEV_META_UNAVAILABLE_APPENDIX =
  "Developer note: Meta has paused Facebook Login while the app has pending setup or review. In developers.facebook.com resolve Alerts / Required actions, complete Settings → Basic (Privacy Policy URL, contact email), finish Data Use Checkup or Business verification if prompted, and add test Facebook accounts under App roles if the app is in Development mode. Retry in desktop Safari/Chrome first.";

const DEV_META_ACCESS_APPENDIX =
  "Developer note: In Development mode only App roles (Administrator, Developer, or Tester) can use Facebook Login. Add your Facebook account under App roles, complete App Review and switch to Live for all merchants, and confirm Settings → Basic (e.g. Privacy Policy URL).";

/** Extra hint after Meta OAuth redirect errors — merchant-safe; dev details only in local builds. */
function metaAppAccessHint(oauthError: string, description: string): string | null {
  const blob = `${oauthError} ${description}`.toLowerCase();
  const isDev = import.meta.env.DEV;

  if (
    blob.includes("feature unavailable") ||
    blob.includes("updating additional details") ||
    blob.includes("try again later")
  ) {
    return isDev
      ? `${MERCHANT_META_UNAVAILABLE_HINT}\n\n${DEV_META_UNAVAILABLE_APPENDIX}`
      : MERCHANT_META_UNAVAILABLE_HINT;
  }

  if (
    !blob.includes("not accessible") &&
    !blob.includes("not active") &&
    !blob.includes("inaccessible") &&
    !blob.includes("app is not live")
  ) {
    return null;
  }

  return isDev
    ? `${MERCHANT_META_ACCESS_HINT}\n\n${DEV_META_ACCESS_APPENDIX}`
    : MERCHANT_META_ACCESS_HINT;
}

function IntegrationsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [onboardingReturn, setOnboardingReturn] = useState(
    () =>
      isOnboardingReturnSearch(search.returnTo) ||
      shouldReturnToOnboardingAfterIntegrations(),
  );
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [banner, setBanner] = useState<{ variant: "default" | "destructive"; title: string; body: string } | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<IgAccount | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (isOnboardingReturnSearch(search.returnTo)) {
      markIntegrationsReturnToOnboarding();
      setOnboardingReturn(true);
      return;
    }
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: store } = await supabase
        .from("store_info")
        .select("store_name")
        .eq("merchant_scoped_id", userData.user.id)
        .maybeSingle();
      if (!store?.store_name?.trim()) {
        markIntegrationsReturnToOnboarding();
        setOnboardingReturn(true);
      }
    })();
  }, [search.returnTo]);

  async function load() {
    setLoadError(null);
    const { data, error } = await supabase
      .from("instagram_accounts")
      .select("id,username,ig_user_id,connected_at")
      .order("connected_at", { ascending: false });
    if (error) {
      setLoadError(error.message);
      setAccounts([]);
      return;
    }
    setAccounts((data ?? []) as IgAccount[]);
  }

  useEffect(() => {
    void load();
    if (sessionStorage.getItem("instagram_connected") === "1") {
      sessionStorage.removeItem("instagram_connected");
      if (!shouldReturnToOnboardingAfterIntegrations()) {
        setBanner({
          variant: "default",
          title: "Instagram connected",
          body: "Your account was linked. You can set up automations next.",
        });
      }
    }
  }, []);

  useEffect(() => {
    const oauthError = search.error;
    if (!oauthError?.trim()) return;

    const descRaw = search.error_description ?? "";
    const desc = descRaw ? decodeOAuthErrorDescription(descRaw) : "";
    const hint = metaAppAccessHint(oauthError, desc);
    const body = hint ? `${desc || oauthError}\n\n${hint}` : desc || oauthError;

    void navigate({ to: "/integrations", replace: true, search: {} }).then(() => {
      setBanner({
        variant: "destructive",
        title: "Couldn't connect Instagram",
        body,
      });
    });
  }, [navigate, search.error, search.error_description]);

  useEffect(() => {
    const rawCode = search.code ?? "";
    const rawState = search.state ?? "";
    if (!rawCode.trim() || !rawState.trim()) return;
    if (metaOAuthCodesInFlight.has(rawCode)) return;
    metaOAuthCodesInFlight.add(rawCode);

    void (async () => {
      try {
        setBanner(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setBanner({
            variant: "destructive",
            title: "Session missing",
            body: "Log in again, then return to Integrations to finish connecting Instagram.",
          });
          await navigate({ to: "/integrations", replace: true, search: {} });
          return;
        }

        const code = safeDecodeOAuthParam(rawCode);
        const state = safeDecodeOAuthParam(rawState);

        const redirectUri = getMetaOAuthRedirectUri();
        let result: Awaited<ReturnType<typeof completeInstagramConnect>>;
        try {
          result = await completeInstagramConnect({
            data: { accessToken: token, code, state, redirectUri },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await navigate({ to: "/integrations", replace: true, search: {} });
          setBanner({
            variant: "destructive",
            title: "Could not finish Instagram link",
            body:
              msg === "Failed to fetch" || msg.includes("fetch")
                ? "We could not complete the connection. Please try again, or contact support if this keeps happening."
                : msg,
          });
          return;
        }

        await navigate({ to: "/integrations", replace: true, search: {} });

        if (!result.ok) {
          setBanner({
            variant: "destructive",
            title: "Instagram connection failed",
            body: result.message,
          });
          return;
        }

        if (!shouldReturnToOnboardingAfterIntegrations()) {
          setBanner({
            variant: "default",
            title: "Instagram connected",
            body: "Your account was linked. You can set up automations next.",
          });
        }
        await load();
      } finally {
        metaOAuthCodesInFlight.delete(rawCode);
      }
    })();
  }, [navigate, search.code, search.state]);

  async function connect() {
    if (onboardingReturn) {
      markIntegrationsReturnToOnboarding();
    }
    setBanner(null);
    setConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setBanner({
          variant: "destructive",
          title: "Not signed in",
          body: "Log in again and retry.",
        });
        return;
      }

      const appId = import.meta.env.VITE_META_APP_ID as string | undefined;
      const redirectUri = getMetaOAuthRedirectUri();

      if (appId?.trim() && redirectUri) {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) {
          setBanner({
            variant: "destructive",
            title: "Not signed in",
            body: "Log in again and retry.",
          });
          return;
        }
        window.location.href = buildMetaOAuthUrlForInstagram(
          appId.trim(),
          redirectUri,
          userData.user.id,
        );
        return;
      }

      let result: Awaited<ReturnType<typeof startInstagramConnect>>;
      try {
        result = await startInstagramConnect({ data: { accessToken: token } });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setBanner({
          variant: "destructive",
          title: "Could not connect",
          body:
            msg === "Failed to fetch" || msg.includes("fetch")
              ? "We could not start the connection. Please refresh the page and try again."
              : msg,
        });
        return;
      }
      if (!result.ok) {
        setBanner({ variant: "destructive", title: "Could not start connection", body: result.message });
        return;
      }
      await load();
      if (!shouldReturnToOnboardingAfterIntegrations()) {
        setBanner({
          variant: "default",
          title: "Preview account added",
          body: "Instagram is not fully configured for this environment. A preview account was added instead — contact your administrator to enable live Instagram connection.",
        });
      }
    } finally {
      setConnecting(false);
    }
  }

  async function confirmDisconnect() {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    const username = disconnectTarget.username;
    const { error } = await supabase.from("instagram_accounts").delete().eq("id", disconnectTarget.id);
    setDisconnecting(false);
    setDisconnectTarget(null);
    if (error) {
      setBanner({
        variant: "destructive",
        title: "Could not disconnect",
        body: error.message,
      });
      return;
    }
    setBanner({
      variant: "default",
      title: "Instagram disconnected",
      body: `@${username} was removed. Connect again when you're ready to restore automations for that account.`,
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your Instagram Business or Creator account so Lynk can automate DMs and comment replies.
        </p>
      </header>

      {onboardingReturn && (
        <Alert className="border-primary/25 bg-primary-soft/40">
          <AlertTitle>Step 1 of 2 — Connect Instagram</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {accounts.length > 0
                ? "Instagram is connected. Continue to store setup to enter your store details."
                : "Connect Instagram first, then continue to store setup. You won't need to leave store setup to connect your account."}
            </p>
            {accounts.length > 0 && (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
                onClick={() => clearIntegrationsReturnToOnboarding()}
              >
                <Link to="/onboarding">
                  Continue to store setup <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {banner && (
        <Alert variant={banner.variant === "destructive" ? "destructive" : "default"}>
          <AlertTitle>{banner.title}</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{banner.body}</AlertDescription>
        </Alert>
      )}

      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load connected accounts</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Instagram</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with the Facebook account that manages your Page linked to Instagram. You only need to do this
                once.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="shrink-0 rounded-full bg-[image:var(--gradient-primary)]"
          >
            {connecting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Plug className="mr-1 h-4 w-4" />
            )}
            Connect account
          </Button>
        </div>

        {accounts.length > 0 ? (
          <ul className="mt-6 divide-y divide-border border-t border-border">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div>
                    <div className="font-medium">@{a.username}</div>
                    <div className="text-xs text-muted-foreground">
                      Connected {new Date(a.connected_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Disconnect @${a.username}`}
                  onClick={() => setDisconnectTarget(a)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          !loadError && (
            <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No Instagram account connected yet.</p>
              <p className="mt-2">
                Click <span className="text-foreground">Connect account</span> and approve access. Your profile must be a
                Business or Creator account linked to a Facebook Page.
              </p>
            </div>
          )
        )}
      </div>

      <AlertDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => {
          if (!open && !disconnecting) setDisconnectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Instagram account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              {disconnectTarget && (
                <>
                  <span className="block">
                    You are about to remove{" "}
                    <span className="font-medium text-foreground">@{disconnectTarget.username}</span> from Lynk
                    Assistant.
                  </span>
                  <span className="block">
                    Automations for this account will stop until you connect again through Meta. You will need to use
                    Connect account and approve access again to link this Instagram profile.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={disconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDisconnect();
              }}
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
