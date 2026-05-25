import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { sendInstagramDm } from "@/integrations/instagram/graph";
import { enrichTriggerPayloadWithUsername } from "@/integrations/dm/resolveHandles.server";
import {
  pickMatchingAutomation,
  type AutomationMessageRow,
  type AutomationRow,
} from "@/integrations/instagram/matchAutomation";
import { forwardDmToCxAssistant } from "@/integrations/cx-assistant/forwardDm";

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

type IgAccount = {
  id: string;
  user_id: string;
  ig_user_id: string;
  username: string;
  access_token: string;
};

async function loadIgAccount(igBusinessAccountId: string): Promise<IgAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id,user_id,ig_user_id,username,access_token")
    .eq("ig_user_id", igBusinessAccountId)
    .maybeSingle();
  if (error || !data) return null;
  return data as IgAccount;
}

async function loadAutomationContext(userId: string) {
  const { data: automations, error: autoErr } = await supabaseAdmin
    .from("automations")
    .select("id,user_id,trigger_type,keywords,post_scope,status")
    .eq("user_id", userId);

  if (autoErr || !automations?.length) {
    return { automations: [] as AutomationRow[], messages: [] as AutomationMessageRow[], postsByAutomation: new Map() };
  }

  const ids = automations.map((a) => a.id);
  const [{ data: messages }, { data: posts }] = await Promise.all([
    supabaseAdmin
      .from("automation_messages")
      .select("automation_id,body,position")
      .in("automation_id", ids)
      .order("position", { ascending: true }),
    supabaseAdmin.from("automation_posts").select("automation_id,ig_post_id").in("automation_id", ids),
  ]);

  const postsByAutomation = new Map<string, Set<string>>();
  for (const p of posts ?? []) {
    const set = postsByAutomation.get(p.automation_id) ?? new Set();
    set.add(p.ig_post_id);
    postsByAutomation.set(p.automation_id, set);
  }

  return {
    automations: automations as AutomationRow[],
    messages: (messages ?? []) as AutomationMessageRow[],
    postsByAutomation,
  };
}

async function recordEvent(
  account: IgAccount,
  opts: {
    automationId: string | null;
    igEventId: string;
    status: "sent" | "failed" | "skipped";
    error?: string;
    payload: unknown;
  },
) {
  const payload = await enrichTriggerPayloadWithUsername(account.access_token, opts.payload);
  await supabaseAdmin.from("dm_events").upsert(
    {
      user_id: account.user_id,
      automation_id: opts.automationId,
      ig_event_id: opts.igEventId,
      status: opts.status,
      error: opts.error ?? null,
      trigger_payload: payload as Json,
    },
    { onConflict: "ig_event_id" },
  );
}

type AutomationContext = Awaited<ReturnType<typeof loadAutomationContext>>;

type DmHandleResult = "ignored" | "automated" | "forwarded_to_ai";

async function handleInboundDm(
  account: IgAccount,
  ctx: AutomationContext,
  event: {
    senderId: string;
    text: string;
    mid: string;
    raw: unknown;
  },
): Promise<DmHandleResult> {
  if (event.senderId === account.ig_user_id) return "ignored";

  const match = pickMatchingAutomation(ctx.automations, ctx.messages, {
    triggerType: "dm",
    text: event.text,
    postsByAutomation: ctx.postsByAutomation,
  });

  if (!match) {
    if (process.env.CX_ASSISTANT_URL && process.env.CX_ASSISTANT_INTERNAL_SECRET) {
      const forwarded = await forwardDmToCxAssistant({
        merchantScopedId: account.ig_user_id,
        event: event.raw,
      });
      if (forwarded) {
        await recordEvent(account, {
          automationId: null,
          igEventId: event.mid,
          status: "skipped",
          error: "Forwarded to AI assistant",
          payload: event.raw,
        });
      } else {
        await recordEvent(account, {
          automationId: null,
          igEventId: event.mid,
          status: "skipped",
          error: "Needs human — AI assistant unreachable",
          payload: event.raw,
        });
      }
      return "forwarded_to_ai";
    }

    await recordEvent(account, {
      automationId: null,
      igEventId: event.mid,
      status: "skipped",
      error: "Needs human — no keyword match and AI assistant unavailable",
      payload: event.raw,
    });
    return "ignored";
  }

  const send = await sendInstagramDm(account.access_token, event.senderId, match.replyBody);
  await recordEvent(account, {
    automationId: match.automation.id,
    igEventId: event.mid,
    status: send.ok ? "sent" : "failed",
    error: send.ok ? undefined : send.message,
    payload: event.raw,
  });
  return "automated";
}

async function handleInboundComment(
  account: IgAccount,
  ctx: AutomationContext,
  event: {
    commenterId: string;
    text: string;
    commentId: string;
    mediaId?: string;
    raw: unknown;
  },
) {
  const match = pickMatchingAutomation(ctx.automations, ctx.messages, {
    triggerType: "comment",
    text: event.text,
    igMediaId: event.mediaId,
    postsByAutomation: ctx.postsByAutomation,
  });

  if (!match) {
    await recordEvent(account, {
      automationId: null,
      igEventId: event.commentId,
      status: "skipped",
      error: "Needs human — no matching comment automation",
      payload: event.raw,
    });
    return;
  }

  const send = await sendInstagramDm(account.access_token, event.commenterId, match.replyBody);
  await recordEvent(account, {
    automationId: match.automation.id,
    igEventId: event.commentId,
    status: send.ok ? "sent" : "failed",
    error: send.ok ? undefined : send.message,
    payload: event.raw,
  });
}

/** Process Meta Instagram webhook payload (already signature-verified). */
export async function processInstagramWebhookPayload(payload: unknown): Promise<void> {
  if (!payload || typeof payload !== "object") return;
  const body = payload as { object?: string; entry?: unknown[] };
  if (body.object !== "instagram" && body.object !== "page") return;

  const entries = Array.isArray(body.entry) ? body.entry : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const igAccountId = typeof e.id === "string" ? e.id : String(e.id ?? "");
    if (!igAccountId) continue;

    const account = await loadIgAccount(igAccountId);
    if (!account) continue;

    const ctx = await loadAutomationContext(account.user_id);

    const messaging = Array.isArray(e.messaging) ? e.messaging : [];
    for (const m of messaging) {
      if (!m || typeof m !== "object") continue;
      const msg = m as Record<string, unknown>;
      const message = msg.message as Record<string, unknown> | undefined;
      if (!message || message.is_echo === true) continue;
      const text = typeof message.text === "string" ? message.text : "";
      const mid = typeof message.mid === "string" ? message.mid : "";
      const sender = msg.sender as { id?: string } | undefined;
      const senderId = sender?.id ?? "";
      if (!senderId || !mid) continue;

      await handleInboundDm(account, ctx, { senderId, text, mid, raw: m });
    }

    const changes = Array.isArray(e.changes) ? e.changes : [];
    for (const c of changes) {
      if (!c || typeof c !== "object") continue;
      const change = c as Record<string, unknown>;
      if (change.field !== "comments") continue;
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;

      const text = typeof value.text === "string" ? value.text : "";
      const commentId =
        typeof value.id === "string"
          ? value.id
          : typeof value.comment_id === "string"
            ? value.comment_id
            : "";
      const from = value.from as { id?: string } | undefined;
      const commenterId = from?.id ?? "";
      const media = value.media as { id?: string } | undefined;
      const mediaId = media?.id ?? (typeof value.media_id === "string" ? value.media_id : undefined);

      if (!commentId || !commenterId) continue;
      await handleInboundComment(account, ctx, { commenterId, text, commentId, mediaId, raw: c });
    }
  }
}
