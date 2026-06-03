/** Data categories removed when a merchant deletes their Lynk account (GDPR / NDPR erasure). */
export const ACCOUNT_DELETION_DATA_CATEGORIES = [
  "Profile (display name)",
  "Store details and FAQs",
  "Connected Instagram account tokens",
  "Automations, DM activity logs, and AI chat sessions",
  "Owner follow-ups tied to your store",
] as const;

export async function requestAccountDeletion(params: {
  accessToken: string;
  confirmEmail: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/account/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      confirmEmail: params.confirmEmail,
      password: params.password,
    }),
  });

  const body = (await res.json()) as { ok?: boolean; message?: string };
  if (body.ok) return { ok: true };
  return { ok: false, message: body.message ?? "Could not delete account." };
}

export function clearLocalAccountData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("lynk_activation_checklist_v1");
    sessionStorage.removeItem("lynk_integrations_return_to");
  } catch {
    /* ignore */
  }
}
