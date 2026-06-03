import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Tables keyed by merchant_scoped_id. Migrations may not all be applied on every project —
 * missing tables are skipped (see deleteMerchantScopedRows).
 */
const MERCHANT_SCOPED_TABLES = [
  "store_info",
  "owner_follow_ups",
  "faqs",
  "sessions",
  "products",
  "orders",
] as const;

const adminDb = supabaseAdmin as SupabaseClient;

function anonClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured on the server.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function merchantScopeIdsForUser(userId: string): Promise<string[]> {
  const { data: igRows, error } = await supabaseAdmin
    .from("instagram_accounts")
    .select("ig_user_id, id")
    .eq("user_id", userId);

  if (error) throw new Error(`instagram_accounts: ${error.message}`);

  const scopes = new Set<string>([userId]);
  for (const row of igRows ?? []) {
    if (row.ig_user_id?.trim()) scopes.add(row.ig_user_id.trim());
    scopes.add(String(row.id));
  }
  return [...scopes];
}

function isMissingTableError(message: string, code?: string): boolean {
  const m = message.toLowerCase();
  return (
    code === "PGRST205" ||
    m.includes("could not find the table") ||
    m.includes("schema cache") ||
    (m.includes("relation") && m.includes("does not exist"))
  );
}

async function deleteMerchantScopedRows(table: (typeof MERCHANT_SCOPED_TABLES)[number], scopes: string[]) {
  const { error } = await adminDb.from(table).delete().in("merchant_scoped_id", scopes);
  if (!error) return;
  if (isMissingTableError(error.message, error.code)) {
    console.warn(`[deleteAccount] Skipping public.${table} (not deployed on this database)`);
    return;
  }
  throw new Error(`${table}: ${error.message}`);
}

export type DeleteAccountInput = {
  accessToken: string;
  confirmEmail: string;
  password: string;
};

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; message: string; status?: number };

/**
 * Permanently delete the authenticated user and associated personal data (GDPR / NDPR erasure).
 * Requires email confirmation + password re-authentication.
 */
function supabaseForUserJwt(accessToken: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured on the server.");
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recordAccountDeletionAudit(): Promise<void> {
  const { error } = await adminDb.from("account_deletion_audit").insert({});
  if (!error) return;
  if (isMissingTableError(error.message, error.code)) {
    console.warn("[deleteAccount] account_deletion_audit not deployed — skipping audit log");
    return;
  }
  console.error("[deleteAccount] audit log:", error.message);
}

export async function deleteAccountForUser(input: DeleteAccountInput): Promise<DeleteAccountResult> {
  const supabase = supabaseForUserJwt(input.accessToken);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData.user;
  if (userErr || !user?.email) {
    return { ok: false, message: "You must be signed in.", status: 401 };
  }

  const email = user.email.trim().toLowerCase();
  const confirm = input.confirmEmail.trim().toLowerCase();
  if (confirm !== email) {
    return { ok: false, message: "Email confirmation does not match your account email.", status: 400 };
  }

  if (!input.password?.trim()) {
    return { ok: false, message: "Enter your password to confirm deletion.", status: 400 };
  }

  const anon = anonClient();
  const { error: authErr } = await anon.auth.signInWithPassword({
    email: user.email,
    password: input.password,
  });
  if (authErr) {
    return { ok: false, message: "Incorrect password.", status: 403 };
  }

  const userId = user.id;
  const scopes = await merchantScopeIdsForUser(userId);

  for (const table of MERCHANT_SCOPED_TABLES) {
    await deleteMerchantScopedRows(table, scopes);
  }

  const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteAuthErr) {
    return { ok: false, message: deleteAuthErr.message, status: 500 };
  }

  await recordAccountDeletionAudit();

  return { ok: true };
}
