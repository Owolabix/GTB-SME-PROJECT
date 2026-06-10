import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const HANDOFF_ACK =
  "I'm connecting you with the store owner now — they'll reply to you here shortly. I've passed your message along.";

const HUMAN_ESCALATION_PATTERNS = [
  /\b(speak|talk|chat)\s+(to|with)\s+(the\s+)?(owner|manager|human|person|someone|vendor)\b/i,
  /\b(need|want)\s+(to\s+)?(speak|talk|chat)\s+(to|with)\b/i,
  /\bconnect\s+me\s+(with|to)\s+(the\s+)?(owner|manager|human|vendor)\b/i,
  /\b(owner|manager|human)\s+(please|pls)\b/i,
  /\breal\s+person\b/i,
  /\bstop\s+(the\s+)?bot\b/i,
];

export function isHumanEscalationRequest(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return HUMAN_ESCALATION_PATTERNS.some((p) => p.test(t));
}

export async function isThreadPaused(
  merchantScopedId: string,
  instagramCustomerId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("conversation_modes")
    .select("mode, manual_until")
    .eq("merchant_scoped_id", merchantScopedId)
    .eq("instagram_customer_id", instagramCustomerId)
    .maybeSingle();

  if (!data || data.mode !== "manual") return false;

  if (!data.manual_until) return true;
  return new Date(data.manual_until).getTime() > Date.now();
}

export async function pauseForEscalation(
  merchantScopedId: string,
  instagramCustomerId: string,
): Promise<void> {
  await supabaseAdmin.from("conversation_modes").upsert(
    {
      merchant_scoped_id: merchantScopedId,
      instagram_customer_id: instagramCustomerId,
      mode: "manual",
      manual_until: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "merchant_scoped_id,instagram_customer_id" },
  );
}

export async function resumeThread(
  merchantScopedId: string,
  instagramCustomerId: string,
): Promise<void> {
  await supabaseAdmin.from("conversation_modes").upsert(
    {
      merchant_scoped_id: merchantScopedId,
      instagram_customer_id: instagramCustomerId,
      mode: "auto",
      manual_until: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "merchant_scoped_id,instagram_customer_id" },
  );
}
