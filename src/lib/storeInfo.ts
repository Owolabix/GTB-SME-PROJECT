import { supabase } from "@/integrations/supabase/client";

export interface StoreInfoFields {
  store_name: string;
  hours: string;
  currency: string;
  instagram_handle: string;
  address: string;
  other_info: string;
}

export const EMPTY_STORE: StoreInfoFields = {
  store_name: "",
  hours: "",
  currency: "",
  instagram_handle: "",
  address: "",
  other_info: "",
};

export async function loadStoreInfo(
  userId: string,
): Promise<StoreInfoFields | null> {
  const { data } = await supabase
    .from("store_info")
    .select("store_name, hours, currency, instagram_handle, address, other_info")
    .eq("merchant_scoped_id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    store_name: data.store_name ?? "",
    hours: data.hours ?? "",
    currency: data.currency ?? "",
    instagram_handle: data.instagram_handle ?? "",
    address: data.address ?? "",
    other_info:
      data.other_info && typeof data.other_info === "object"
        ? JSON.stringify(data.other_info, null, 2)
        : "",
  };
}

export async function saveStoreInfo(
  userId: string,
  fields: StoreInfoFields,
): Promise<{ ok: boolean; error?: string }> {
  let otherInfoJson: Record<string, string> | null = null;
  if (fields.other_info.trim()) {
    try {
      otherInfoJson = JSON.parse(fields.other_info) as Record<string, string>;
    } catch {
      return { ok: false, error: "Other info must be valid JSON (or leave it empty)." };
    }
  }

  const row = {
    merchant_scoped_id: userId,
    store_name: fields.store_name.trim() || null,
    hours: fields.hours.trim() || null,
    currency: fields.currency.trim() || null,
    instagram_handle: fields.instagram_handle.trim().replace(/^@/, "") || null,
    address: fields.address.trim() || null,
    other_info: otherInfoJson,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("store_info")
    .upsert(row, { onConflict: "merchant_scoped_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
