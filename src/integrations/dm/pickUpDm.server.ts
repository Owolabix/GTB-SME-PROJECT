import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { forwardDmToCxAssistant } from "@/integrations/cx-assistant/forwardDm";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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

export async function pickUpSkippedDmForUser(
  accessToken: string,
  eventId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = supabaseForUserJwt(accessToken);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: row, error: rowErr } = await supabase
    .from("dm_events")
    .select("id,status,error,trigger_payload")
    .eq("id", eventId)
    .maybeSingle();

  if (rowErr || !row) {
    return { ok: false, message: "Activity not found." };
  }
  if (row.status !== "skipped") {
    return { ok: false, message: "Only items needing human follow-up can be picked up." };
  }
  const err = row.error?.toLowerCase() ?? "";
  if (err.includes("ai reply sent") || err.includes("picked up")) {
    return { ok: false, message: "This message was already handled by AI." };
  }

  const parsed = parseDmEventPayload(row.trigger_payload);
  if (!parsed.senderId) {
    return { ok: false, message: "No customer id in this event." };
  }

  const { data: igAccount } = await supabase
    .from("instagram_accounts")
    .select("ig_user_id")
    .limit(1)
    .maybeSingle();

  if (!igAccount?.ig_user_id) {
    return { ok: false, message: "Connect Instagram under Integrations first." };
  }

  const base = process.env.CX_ASSISTANT_URL?.replace(/\/$/, "");
  const secret = process.env.CX_ASSISTANT_INTERNAL_SECRET;
  if (!base || !secret) {
    return { ok: false, message: "CX-Assistant is not configured (CX_ASSISTANT_URL / secret)." };
  }

  const event =
    row.trigger_payload && typeof row.trigger_payload === "object"
      ? row.trigger_payload
      : {
          sender: { id: parsed.senderId },
          message: { text: parsed.messagePreview ?? "", mid: `pickup_${eventId}` },
        };

  await forwardDmToCxAssistant({
    merchantScopedId: igAccount.ig_user_id,
    event,
  });

  await supabaseAdmin
    .from("dm_events")
    .update({ error: "Picked up — AI assistant handling" })
    .eq("id", eventId);

  return { ok: true };
}
