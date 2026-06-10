import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  isOpenFollowUpStatus,
  type OwnerFollowUp,
} from "@/lib/ownerFollowUps";
import { parseDmEventPayload } from "@/lib/dmEventDisplay";
import { resumeThread } from "@/integrations/dm/conversationMode.server";

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

type MerchantScope = {
  userId: string;
  scopeIds: string[];
  primaryIgUserId: string | null;
};

async function getMerchantScope(accessToken: string): Promise<MerchantScope> {
  const supabase = supabaseForUserJwt(accessToken);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("You must be signed in.");
  }

  const userId = userData.user.id;
  const { data: igRows, error: igErr } = await supabase
    .from("instagram_accounts")
    .select("id, ig_user_id")
    .eq("user_id", userId);
  if (igErr) throw new Error(igErr.message);

  const scopeIds = new Set<string>([userId]);
  let primaryIgUserId: string | null = null;
  for (const row of igRows ?? []) {
    if (row.ig_user_id) {
      scopeIds.add(row.ig_user_id);
      primaryIgUserId ??= row.ig_user_id;
    }
    scopeIds.add(row.id);
  }
  if ((igRows ?? []).length > 0) {
    scopeIds.add("default");
  }

  return { userId, scopeIds: [...scopeIds], primaryIgUserId };
}

/** Only backfill from dm_events in this window (avoids stale customers e.g. no message today). */
const BACKFILL_MAX_AGE_MS = 48 * 60 * 60 * 1000;

/** Same Instagram escalation — CX insert, prior backfill, and dm_event log land within minutes. */
const BACKFILL_EVENT_MATCH_MS = 10 * 60 * 1000;

function followUpMatchesDmEvent(
  row: { created_at: string },
  eventCreatedAt: string | null | undefined,
): boolean {
  if (!eventCreatedAt) return false;
  const eventMs = new Date(eventCreatedAt).getTime();
  const rowMs = new Date(row.created_at).getTime();
  if (Number.isNaN(eventMs) || Number.isNaN(rowMs)) return false;
  return Math.abs(rowMs - eventMs) <= BACKFILL_EVENT_MATCH_MS;
}

/**
 * CX-Assistant sometimes updates dm_events ("owner follow-up created") without inserting
 * owner_follow_ups. Create missing rows only for recent activity.
 */
async function backfillFollowUpsFromDmEvents(scope: MerchantScope): Promise<void> {
  const merchantForInsert = scope.primaryIgUserId ?? scope.userId;
  const since = new Date(Date.now() - BACKFILL_MAX_AGE_MS).toISOString();

  const { data: events, error: evErr } = await supabaseAdmin
    .from("dm_events")
    .select("id, trigger_payload, error, created_at")
    .eq("user_id", scope.userId)
    .ilike("error", "%owner follow-up created%")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(30);

  if (evErr || !events?.length) return;

  for (const event of events) {
    const parsed = parseDmEventPayload(event.trigger_payload);
    if (!parsed.senderId) continue;

    const { data: existing } = await supabaseAdmin
      .from("owner_follow_ups")
      .select("id, status, created_at")
      .eq("instagram_customer_id", parsed.senderId)
      .in("merchant_scoped_id", scope.scopeIds);

    const existingRows = existing ?? [];

    if (existingRows.some((r) => isOpenFollowUpStatus(r.status))) continue;

    // Do not recreate after the merchant marked done — row still matches this dm_event.
    if (existingRows.some((r) => followUpMatchesDmEvent(r, event.created_at))) continue;

    const summary =
      parsed.messagePreview?.trim() ||
      "Customer needs your attention (escalated from Instagram DM)";

    await supabaseAdmin.from("owner_follow_ups").insert({
      merchant_scoped_id: merchantForInsert,
      instagram_customer_id: parsed.senderId,
      summary: summary.slice(0, 500),
      status: "open",
      created_at: event.created_at ?? new Date().toISOString(),
    });
  }
}

function isManualModeRowActive(row: {
  mode: string;
  manual_until: string | null;
}): boolean {
  if (row.mode !== "manual") return false;
  if (!row.manual_until) return true;
  return new Date(row.manual_until).getTime() > Date.now();
}

/** Ensure a dashboard row exists whenever a customer thread is in owner handoff. */
export async function ensureOpenFollowUpForCustomer(
  merchantScopedId: string,
  instagramCustomerId: string,
  summary?: string,
): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("owner_follow_ups")
    .select("id, status")
    .eq("instagram_customer_id", instagramCustomerId)
    .eq("merchant_scoped_id", merchantScopedId);

  if (existing?.some((r) => isOpenFollowUpStatus(r.status))) return;

  await supabaseAdmin.from("owner_follow_ups").insert({
    merchant_scoped_id: merchantScopedId,
    instagram_customer_id: instagramCustomerId,
    summary: (
      summary ?? "Customer awaiting owner reply (handoff active)"
    ).slice(0, 500),
    status: "open",
  });
}

/** Paused threads without a follow-up row are invisible on the dashboard — backfill them. */
async function backfillFollowUpsFromPausedThreads(scope: MerchantScope): Promise<void> {
  const merchantForInsert = scope.primaryIgUserId ?? scope.userId;

  const { data: paused } = await supabaseAdmin
    .from("conversation_modes")
    .select("merchant_scoped_id, instagram_customer_id, mode, manual_until")
    .in("merchant_scoped_id", scope.scopeIds)
    .eq("mode", "manual");

  for (const row of paused ?? []) {
    if (!isManualModeRowActive(row)) continue;

    const merchantScopedId = scope.scopeIds.includes(row.merchant_scoped_id)
      ? row.merchant_scoped_id
      : merchantForInsert;

    await ensureOpenFollowUpForCustomer(
      merchantScopedId,
      row.instagram_customer_id,
      "Customer awaiting owner reply (handoff active)",
    );
  }
}

/** dm_events logged while paused but before follow-up insert landed. */
async function backfillFollowUpsFromPausedEvents(scope: MerchantScope): Promise<void> {
  const merchantForInsert = scope.primaryIgUserId ?? scope.userId;
  const since = new Date(Date.now() - BACKFILL_MAX_AGE_MS).toISOString();

  const { data: events } = await supabaseAdmin
    .from("dm_events")
    .select("trigger_payload, error, created_at")
    .eq("user_id", scope.userId)
    .or(
      "error.ilike.%Thread paused%,error.ilike.%Escalated to owner%,error.ilike.%owner follow-up created%",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(40);

  for (const event of events ?? []) {
    const parsed = parseDmEventPayload(event.trigger_payload);
    if (!parsed.senderId) continue;

    const { data: modeRow } = await supabaseAdmin
      .from("conversation_modes")
      .select("mode, manual_until")
      .eq("instagram_customer_id", parsed.senderId)
      .in("merchant_scoped_id", scope.scopeIds)
      .maybeSingle();

    if (!modeRow || !isManualModeRowActive(modeRow)) continue;

    const { data: existing } = await supabaseAdmin
      .from("owner_follow_ups")
      .select("id, status")
      .eq("instagram_customer_id", parsed.senderId)
      .in("merchant_scoped_id", scope.scopeIds);

    if (existing?.some((r) => isOpenFollowUpStatus(r.status))) continue;

    const summary =
      parsed.messagePreview?.trim() ||
      "Customer needs your attention (escalated from Instagram DM)";

    await supabaseAdmin.from("owner_follow_ups").insert({
      merchant_scoped_id: merchantForInsert,
      instagram_customer_id: parsed.senderId,
      summary: summary.slice(0, 500),
      status: "open",
      created_at: event.created_at ?? new Date().toISOString(),
    });
  }
}

export async function loadOwnerFollowUpsForUser(
  accessToken: string,
  opts?: { openOnly?: boolean },
): Promise<OwnerFollowUp[]> {
  const scope = await getMerchantScope(accessToken);
  await backfillFollowUpsFromDmEvents(scope);
  await backfillFollowUpsFromPausedThreads(scope);
  await backfillFollowUpsFromPausedEvents(scope);

  const { data, error } = await supabaseAdmin
    .from("owner_follow_ups")
    .select("id,merchant_scoped_id,instagram_customer_id,summary,status,created_at")
    .in("merchant_scoped_id", scope.scopeIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  let rows = (data ?? []) as OwnerFollowUp[];
  if (opts?.openOnly !== false) {
    rows = rows.filter((r) => isOpenFollowUpStatus(r.status));
  }
  return rows;
}

export async function markOwnerFollowUpDoneForUser(
  accessToken: string,
  followUpId: string,
): Promise<void> {
  const scope = await getMerchantScope(accessToken);
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from("owner_follow_ups")
    .select("id,merchant_scoped_id,instagram_customer_id")
    .eq("id", followUpId)
    .in("merchant_scoped_id", scope.scopeIds)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) {
    throw new Error("Follow-up not found or already resolved.");
  }

  const { data, error } = await supabaseAdmin
    .from("owner_follow_ups")
    .update({ status: "done" })
    .eq("id", followUpId)
    .in("merchant_scoped_id", scope.scopeIds)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Follow-up not found or already resolved.");
  }

  const merchantScopedId =
    scope.primaryIgUserId && scope.scopeIds.includes(row.merchant_scoped_id)
      ? row.merchant_scoped_id
      : scope.primaryIgUserId ?? row.merchant_scoped_id;
  await resumeThread(merchantScopedId, row.instagram_customer_id);
}
