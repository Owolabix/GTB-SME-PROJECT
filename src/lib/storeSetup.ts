import { supabase } from "@/integrations/supabase/client";

export const STORE_SETUP_CHANGED_EVENT = "lynk-store-setup-changed";

/** First step for new merchants (connect Instagram before store details). */
export const SETUP_ENTRY_PATH = "/integrations";

/** Routes reachable before store_info.store_name is saved. */
export const ONBOARDING_SETUP_PATHS = ["/integrations", "/onboarding"] as const;

export function isOnboardingSetupPath(pathname: string): boolean {
  return ONBOARDING_SETUP_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function isStoreSetupCompleteForUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("store_info")
    .select("store_name")
    .eq("merchant_scoped_id", userId)
    .maybeSingle();

  if (error) {
    console.error("store_setup check:", error.message);
    return false;
  }
  return Boolean(data?.store_name?.trim());
}

export async function isInstagramConnectedForUser(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("instagram_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("instagram_connected check:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export function notifyStoreSetupChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_SETUP_CHANGED_EVENT));
  }
}
