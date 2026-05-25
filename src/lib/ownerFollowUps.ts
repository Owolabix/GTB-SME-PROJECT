import { supabase } from "@/integrations/supabase/client";

export type OwnerFollowUp = {
  id: string;
  merchant_scoped_id: string;
  instagram_customer_id: string;
  summary: string;
  status: string;
  created_at: string;
};

export async function loadMerchantIgIds(): Promise<string[]> {
  const { data, error } = await supabase.from("instagram_accounts").select("ig_user_id");
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.ig_user_id).filter(Boolean);
  // Legacy CX-Assistant rows used DEFAULT_MERCHANT_SCOPED_ID=default
  if (ids.length > 0 && !ids.includes("default")) {
    ids.push("default");
  }
  return ids;
}

/**
 * Loads owner_follow_ups for the logged-in merchant.
 * RLS (Supabase policies) restricts rows to their instagram_accounts; do not over-filter client-side.
 */
export async function loadOwnerFollowUps(opts?: { openOnly?: boolean }): Promise<OwnerFollowUp[]> {
  let query = supabase
    .from("owner_follow_ups")
    .select("id,merchant_scoped_id,instagram_customer_id,summary,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (opts?.openOnly !== false) {
    query = query.in("status", ["open", "Open", "OPEN"]);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as OwnerFollowUp[];
}

export async function markOwnerFollowUpDone(id: string): Promise<void> {
  const { error } = await supabase.from("owner_follow_ups").update({ status: "done" }).eq("id", id);
  if (error) throw new Error(error.message);
}
