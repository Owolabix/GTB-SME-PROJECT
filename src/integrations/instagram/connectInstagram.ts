import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { resolveMetaRedirectUriForTokenExchange } from "@/integrations/instagram/metaRedirectUri";

/** Facebook / Graph error payloads vary by endpoint. */
function readMetaErrorJson(body: unknown): string {
  if (body == null) return "Empty response from Meta.";
  if (typeof body !== "object") return String(body);
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") {
    const desc = typeof b.error_description === "string" ? b.error_description : "";
    return [b.error, desc].filter(Boolean).join(": ");
  }
  if (b.error && typeof b.error === "object") {
    const err = b.error as { message?: string; error_user_msg?: string };
    return err.message ?? err.error_user_msg ?? JSON.stringify(b.error);
  }
  if (typeof b.message === "string") return b.message;
  return JSON.stringify(body);
}

function supabaseForUserJwt(accessToken: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL or key is not configured on the server.");
  }
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const accessSchema = z.object({ accessToken: z.string().min(1) });

/** Preview-only: inserts a demo row. Real Instagram uses `VITE_META_*` + browser redirect (see integrations page). */
export const startInstagramConnect = createServerFn({ method: "POST" })
  .inputValidator(accessSchema)
  .handler(async ({ data }) => {
    const supabase = supabaseForUserJwt(data.accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return { ok: false as const, message: "You must be signed in." };
    }

    const { error: insErr } = await supabase.from("instagram_accounts").insert({
      user_id: userData.user.id,
      username: "demo_store",
      ig_user_id: `demo_${crypto.randomUUID()}`,
      access_token: "demo_local_token",
    });
    if (insErr) {
      return { ok: false as const, message: insErr.message };
    }
    return { ok: true as const, mode: "demo" as const };
  });

const completeSchema = z.object({
  accessToken: z.string().min(1),
  code: z.string().min(1),
  state: z.string().min(1),
  /** Must match redirect_uri used when opening Meta OAuth (same origin + /integrations). */
  redirectUri: z.string().min(1).optional(),
});

export const completeInstagramConnect = createServerFn({ method: "POST" })
  .inputValidator(completeSchema)
  .handler(async ({ data }) => {
    try {
      const supabase = supabaseForUserJwt(data.accessToken);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return { ok: false as const, message: "You must be signed in." };
      }
      if (data.state !== userData.user.id) {
        return { ok: false as const, message: "Invalid OAuth state. Please try connecting again." };
      }

      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      const redirectUri = resolveMetaRedirectUriForTokenExchange(data.redirectUri);
      if (!appId || !appSecret) {
        return {
          ok: false as const,
          message:
            "Meta app is not configured on the server (META_APP_ID, META_APP_SECRET). Restart the dev server after editing .env.",
        };
      }
      if (!redirectUri) {
        return {
          ok: false as const,
          message:
            "Invalid OAuth redirect URI. Use the same URL you opened in the browser (e.g. https://localhost:8080/integrations) and add it to Meta → Facebook Login → Valid OAuth Redirect URIs.",
        };
      }

      const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("code", data.code);

      const shortRes = await fetch(tokenUrl.toString());
      let shortJson: unknown;
      try {
        shortJson = await shortRes.json();
      } catch {
        return {
          ok: false as const,
          message: "Meta token response was not JSON. Check META_APP_SECRET and that the OAuth code is still valid (codes expire quickly).",
        };
      }
      const shortObj = shortJson as { access_token?: string };
      if (!shortRes.ok || !shortObj.access_token) {
        const metaMsg = readMetaErrorJson(shortJson);
        const redirectHint =
          metaMsg.toLowerCase().includes("redirect_uri") || metaMsg.toLowerCase().includes("redirect uri")
            ? ` Add this exact URL in Meta → Facebook Login → Valid OAuth Redirect URIs: ${redirectUri}`
            : "";
        return { ok: false as const, message: metaMsg + redirectHint };
      }

      const longUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      longUrl.searchParams.set("grant_type", "fb_exchange_token");
      longUrl.searchParams.set("client_id", appId);
      longUrl.searchParams.set("client_secret", appSecret);
      longUrl.searchParams.set("fb_exchange_token", shortObj.access_token);

      const longRes = await fetch(longUrl.toString());
      let longJson: unknown;
      try {
        longJson = await longRes.json();
      } catch {
        return { ok: false as const, message: "Meta long-lived token response was not JSON." };
      }
      const longObj = longJson as { access_token?: string; expires_in?: number };
      if (!longRes.ok || !longObj.access_token) {
        return { ok: false as const, message: readMetaErrorJson(longJson) };
      }

      const userToken = longObj.access_token;
      const pagesUrl = new URL("https://graph.facebook.com/v19.0/me/accounts");
      pagesUrl.searchParams.set(
        "fields",
        "name,access_token,instagram_business_account{id,username}",
      );
      pagesUrl.searchParams.set("access_token", userToken);
      pagesUrl.searchParams.set("limit", "100");

      const pagesRes = await fetch(pagesUrl.toString());
      let pagesJson: unknown;
      try {
        pagesJson = await pagesRes.json();
      } catch {
        return { ok: false as const, message: "Meta pages response was not JSON." };
      }
      const pagesObj = pagesJson as {
        data?: Array<{
          access_token?: string;
          instagram_business_account?: { id: string; username?: string };
        }>;
      };
      if (!pagesRes.ok) {
        return { ok: false as const, message: readMetaErrorJson(pagesJson) };
      }

      const pages = pagesObj.data ?? [];
      if (pages.length === 0) {
        return {
          ok: false as const,
          message:
            "This Facebook login has no Facebook Pages, or the app lacks permission to list them. Create a Facebook Page, link your Instagram Business/Creator account to it in Meta Business Suite, and accept all requested permissions when connecting.",
        };
      }

      const row = pages.find((p) => p.instagram_business_account?.id);
      const ig = row?.instagram_business_account;
      const pageToken = row?.access_token;
      if (!ig?.id || !pageToken) {
        return {
          ok: false as const,
          message:
            "No Instagram Business account is linked to any of your Facebook Pages. In Meta Business Suite (or Facebook Page settings), connect the Instagram profile to the Page, then try again.",
        };
      }

      const username = ig.username ?? `user_${ig.id}`;
      const expiresAt =
        typeof longObj.expires_in === "number"
          ? new Date(Date.now() + longObj.expires_in * 1000).toISOString()
          : null;

      await supabase
        .from("instagram_accounts")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("ig_user_id", ig.id);

      const { error: insErr } = await supabase.from("instagram_accounts").insert({
        user_id: userData.user.id,
        username,
        ig_user_id: ig.id,
        access_token: pageToken,
        token_expires_at: expiresAt,
      });
      if (insErr) {
        let hint = insErr.message;
        if (insErr.message.includes("row-level security") || insErr.code === "42501") {
          hint += " — In Supabase, allow authenticated users to insert/update rows in instagram_accounts where user_id = auth.uid().";
        }
        return { ok: false as const, message: hint };
      }

      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false as const, message: msg || "Unexpected error while finishing Instagram connection." };
    }
  });
