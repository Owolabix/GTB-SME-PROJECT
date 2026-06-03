import { supabase } from "@/integrations/supabase/client";

export type OwnerFollowUp = {
  id: string;
  merchant_scoped_id: string;
  instagram_customer_id: string;
  summary: string;
  status: string;
  created_at: string;
};

/** Treat any non-done status as open (CX may use open, pending, etc.). */
export function isOpenFollowUpStatus(status: string | null | undefined): boolean {
  if (status == null || status.trim() === "") return true;
  return !/^done$/i.test(status.trim());
}

/**
 * Loads owner follow-ups via server API (scoped lookup + backfill from dm_events).
 */
export async function loadOwnerFollowUps(opts?: { openOnly?: boolean }): Promise<OwnerFollowUp[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return [];

  const res = await fetch("/api/owner-follow-ups", {
    headers: { Authorization: `Bearer ${token}` },
  });

  let body: { ok?: boolean; followUps?: OwnerFollowUp[]; message?: string };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!res.ok || !body.ok) {
    throw new Error(body.message ?? `Could not load follow-ups (${res.status})`);
  }

  let rows = body.followUps ?? [];
  if (opts?.openOnly === false) {
    return rows;
  }
  return rows.filter((r) => isOpenFollowUpStatus(r.status));
}

export async function markOwnerFollowUpDone(id: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in.");

  const res = await fetch("/api/owner-follow-ups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });

  let body: { ok?: boolean; message?: string };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!res.ok || !body.ok) {
    throw new Error(body.message ?? `Could not update follow-up (${res.status})`);
  }
}
