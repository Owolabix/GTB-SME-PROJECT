import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchInstagramUsername } from "@/integrations/instagram/graph";
import { parseDmEventPayload } from "@/lib/dmEventDisplay";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const HANDLE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const handleCache = new Map<string, { handle: string; expires: number }>();

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

function cacheGet(customerId: string): string | null {
  const hit = handleCache.get(customerId);
  if (!hit || hit.expires < Date.now()) {
    handleCache.delete(customerId);
    return null;
  }
  return hit.handle;
}

function cacheSet(customerId: string, handle: string) {
  handleCache.set(customerId, { handle, expires: Date.now() + HANDLE_CACHE_TTL_MS });
}

function normalizeHandle(username: string): string {
  return username.startsWith("@") ? username : `@${username}`;
}

/** Merge @username into Meta webhook JSON when the payload only has sender id. */
export async function enrichTriggerPayloadWithUsername(
  pageAccessToken: string,
  payload: unknown,
): Promise<unknown> {
  if (!payload || typeof payload !== "object") return payload;
  const parsed = parseDmEventPayload(payload);
  if (parsed.handle || !parsed.senderId) return payload;

  const cached = cacheGet(parsed.senderId);
  const username =
    cached?.replace(/^@/, "") ??
    (await fetchInstagramUsername(pageAccessToken, parsed.senderId));
  if (!username) return payload;

  cacheSet(parsed.senderId, normalizeHandle(username));

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

/** @handles already stored on dm_events.trigger_payload (from webhook enrichment). */
async function handlesFromDmEvents(
  userId: string,
  customerIds: string[],
): Promise<Record<string, string>> {
  if (customerIds.length === 0) return {};

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabaseAdmin
    .from("dm_events")
    .select("trigger_payload")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(300);

  const want = new Set(customerIds);
  const out: Record<string, string> = {};
  for (const event of events ?? []) {
    const parsed = parseDmEventPayload(event.trigger_payload);
    if (!parsed.senderId || !want.has(parsed.senderId) || out[parsed.senderId] || !parsed.handle) {
      continue;
    }
    out[parsed.senderId] = parsed.handle;
    cacheSet(parsed.senderId, parsed.handle);
  }
  return out;
}

async function resolveHandlesForSenderIds(
  pageToken: string,
  senderIds: Iterable<string>,
  known: Record<string, string> = {},
): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...known };
  const missing = [...new Set(senderIds)].filter((id) => id && !out[id]);

  for (const id of missing) {
    const cached = cacheGet(id);
    if (cached) {
      out[id] = cached;
      continue;
    }
  }

  const stillMissing = missing.filter((id) => !out[id]);
  // Resolve one at a time to avoid Meta application rate limits.
  for (const id of stillMissing) {
    const username = await fetchInstagramUsername(pageToken, id);
    if (username) {
      const handle = normalizeHandle(username);
      out[id] = handle;
      cacheSet(id, handle);
    }
  }

  return out;
}

export async function resolveDmHandlesForUser(
  accessToken: string,
  payloads: unknown[],
): Promise<Record<string, string>> {
  const fromPayload: Record<string, string> = {};
  const senderIds = new Set<string>();
  for (const payload of payloads) {
    const parsed = parseDmEventPayload(payload);
    if (!parsed.senderId) continue;
    if (parsed.handle) {
      fromPayload[parsed.senderId] = parsed.handle;
      cacheSet(parsed.senderId, parsed.handle);
    } else {
      senderIds.add(parsed.senderId);
    }
  }

  const pageToken = await getPageTokenForUser(accessToken);
  if (!pageToken) return fromPayload;

  return resolveHandlesForSenderIds(pageToken, senderIds, fromPayload);
}

/** Resolve @handles for owner_follow_ups.instagram_customer_id values. */
export async function resolveCustomerHandlesForUser(
  accessToken: string,
  customerIds: string[],
): Promise<Record<string, string>> {
  const supabase = supabaseForUserJwt(accessToken);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return {};

  const fromEvents = await handlesFromDmEvents(userData.user.id, customerIds);

  const pageToken = await getPageTokenForUser(accessToken);
  if (!pageToken) return fromEvents;

  return resolveHandlesForSenderIds(pageToken, customerIds, fromEvents);
}
