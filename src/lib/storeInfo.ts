import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  isWestAfricaCurrencyCode,
  normalizeWestAfricaCurrency,
} from "@/lib/westAfricaCurrencies";

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

export function normalizeInstagramHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

/** Latest connected Instagram username for the logged-in user, if any. */
export async function getConnectedInstagramHandle(): Promise<string | null> {
  const { data, error } = await supabase
    .from("instagram_accounts")
    .select("username")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const username = data?.username?.trim();
  return username ? normalizeInstagramHandle(username) : null;
}

/** Keep store_info.instagram_handle aligned with a connected Instagram account. */
export async function syncStoreInstagramHandle(
  userId: string,
  handle: string,
): Promise<void> {
  const normalized = normalizeInstagramHandle(handle);
  if (!normalized) return;

  const { data: existing } = await supabase
    .from("store_info")
    .select("merchant_scoped_id")
    .eq("merchant_scoped_id", userId)
    .maybeSingle();

  if (!existing) return;

  await supabase
    .from("store_info")
    .update({
      instagram_handle: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_scoped_id", userId);
}

const FIELD_LABELS: Record<keyof StoreInfoFields, string> = {
  store_name: "Store name",
  instagram_handle: "Instagram handle",
  currency: "Currency",
  hours: "Your availability for escalations",
  address: "Address",
  other_info: "Additional details",
};

const ONBOARDING_REQUIRED: (keyof StoreInfoFields)[] = [
  "store_name",
  "currency",
  "hours",
  "address",
];

/** Plain-text display for `other_info` (legacy JSON objects are flattened). */
export function formatOtherInfoForDisplay(value: Json | null): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, Json>;
    if (typeof obj.notes === "string") return obj.notes;
    return Object.entries(obj)
      .filter(([, v]) => v != null && v !== "")
      .map(([key, v]) => {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `${label}: ${String(v)}`;
      })
      .join("\n");
  }
  return "";
}

function otherInfoToJson(text: string): Json | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateStoreInfoFields(
  fields: StoreInfoFields,
  options: { requireAll?: boolean } = {},
): string | null {
  const keys = options.requireAll
    ? ONBOARDING_REQUIRED
    : (["store_name"] as const);

  for (const key of keys) {
    if (!fields[key].trim()) {
      return `${FIELD_LABELS[key]} is required.`;
    }
  }
  if (fields.currency.trim() && !isWestAfricaCurrencyCode(fields.currency)) {
    return "Please select a supported currency (NGN, ZAR, or GHS).";
  }
  return null;
}

export async function loadStoreInfo(
  userId: string,
): Promise<StoreInfoFields | null> {
  const connected = await getConnectedInstagramHandle();

  const { data } = await supabase
    .from("store_info")
    .select("store_name, hours, currency, instagram_handle, address, other_info")
    .eq("merchant_scoped_id", userId)
    .maybeSingle();

  if (!data && !connected) return null;

  const storedHandle = normalizeInstagramHandle(data?.instagram_handle ?? "");
  if (connected && storedHandle !== connected) {
    void syncStoreInstagramHandle(userId, connected);
  }

  return {
    store_name: data?.store_name ?? "",
    hours: data?.hours ?? "",
    currency: normalizeWestAfricaCurrency(data?.currency ?? ""),
    instagram_handle: connected ?? storedHandle,
    address: data?.address ?? "",
    other_info: formatOtherInfoForDisplay(data?.other_info ?? null),
  };
}

export async function saveStoreInfo(
  userId: string,
  fields: StoreInfoFields,
): Promise<{ ok: boolean; error?: string }> {
  const connected = await getConnectedInstagramHandle();
  const handle = connected ?? normalizeInstagramHandle(fields.instagram_handle);

  const row = {
    merchant_scoped_id: userId,
    store_name: fields.store_name.trim() || null,
    hours: fields.hours.trim() || null,
    currency: normalizeWestAfricaCurrency(fields.currency) || null,
    instagram_handle: handle || null,
    address: fields.address.trim() || null,
    other_info: otherInfoToJson(fields.other_info),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("store_info")
    .upsert(row, { onConflict: "merchant_scoped_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
