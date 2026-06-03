import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  fetchAisleStorefrontProducts,
  normalizeAisleInstagram,
} from "@/integrations/aisle/fetchStorefrontProducts";
import type { AisleCatalogueResponse } from "@/integrations/aisle/types";

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

async function merchantInstagramHandle(accessToken: string): Promise<string | null> {
  const supabase = supabaseForUserJwt(accessToken);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error("You must be signed in.");
  }

  const { data: igRow } = await supabase
    .from("instagram_accounts")
    .select("username")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fromIg = normalizeAisleInstagram(igRow?.username);
  if (fromIg) return fromIg;

  const { data: storeRow } = await supabase
    .from("store_info")
    .select("instagram_handle")
    .eq("merchant_scoped_id", userData.user.id)
    .maybeSingle();

  return normalizeAisleInstagram(storeRow?.instagram_handle);
}

export async function loadAisleCatalogueForUser(
  accessToken: string,
): Promise<AisleCatalogueResponse & { instagram_query: string }> {
  const instagram = await merchantInstagramHandle(accessToken);
  if (!instagram) {
    throw new Error(
      "Connect Instagram or set your store handle in Settings so Lynk can find your AISLE catalogue.",
    );
  }

  const catalogue = await fetchAisleStorefrontProducts({ instagram });
  return { ...catalogue, instagram_query: instagram };
}
