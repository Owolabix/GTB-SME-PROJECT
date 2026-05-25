import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchInstagramUsername } from "@/integrations/instagram/graph";
import { parseDmEventPayload } from "@/lib/dmEventDisplay";

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

/** Merge @username into Meta webhook JSON when the payload only has sender id. */
export async function enrichTriggerPayloadWithUsername(
  pageAccessToken: string,
  payload: unknown,
): Promise<unknown> {
  if (!payload || typeof payload !== "object") return payload;
  const parsed = parseDmEventPayload(payload);
  if (parsed.handle || !parsed.senderId) return payload;

  const username = await fetchInstagramUsername(pageAccessToken, parsed.senderId);
  if (!username) return payload;

  const p = { ...(payload as Record<string, unknown>) };
  const sender = p.sender as Record<string, unknown> | undefined;
  if (sender?.id) {
    p.sender = { ...sender, username };
    return p;
  }
  const from = p.from as Record<string, unknown> | undefined;
  if (from?.id) {
    p.from = { ...from, username };
    return p;
  }
  return payload;
}

async function getPageTokenForUser(accessToken: string): Promise<string | null> {
  const supabase = supabaseForUserJwt(accessToken);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("You must be signed in.");
  }

  const { data: igAccount } = await supabase
    .from("instagram_accounts")
    .select("access_token")
    .limit(1)
    .maybeSingle();

  return igAccount?.access_token ?? null;
}

async function resolveHandlesForSenderIds(
  pageToken: string,
  senderIds: Iterable<string>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    [...new Set(senderIds)].map(async (id) => {
      if (!id) return;
      const username = await fetchInstagramUsername(pageToken, id);
      if (username) out[id] = username.startsWith("@") ? username : `@${username}`;
    }),
  );
  return out;
}

export async function resolveDmHandlesForUser(
  accessToken: string,
  payloads: unknown[],
): Promise<Record<string, string>> {
  const pageToken = await getPageTokenForUser(accessToken);
  if (!pageToken) return {};

  const senderIds = new Set<string>();
  for (const payload of payloads) {
    const parsed = parseDmEventPayload(payload);
    if (parsed.senderId && !parsed.handle) {
      senderIds.add(parsed.senderId);
    }
  }

  return resolveHandlesForSenderIds(pageToken, senderIds);
}

/** Resolve @handles for owner_follow_ups.instagram_customer_id values. */
export async function resolveCustomerHandlesForUser(
  accessToken: string,
  customerIds: string[],
): Promise<Record<string, string>> {
  const pageToken = await getPageTokenForUser(accessToken);
  if (!pageToken) return {};
  return resolveHandlesForSenderIds(pageToken, customerIds);
}
