/** West Africa storefront currencies supported in Lynk. */
export const WEST_AFRICA_CURRENCIES = [
  { code: "NGN", label: "NGN — Nigerian Naira" },
  { code: "ZAR", label: "ZAR — South African Rand" },
  { code: "GHS", label: "GHS — Ghanaian Cedi" },
] as const;

export type WestAfricaCurrencyCode = (typeof WEST_AFRICA_CURRENCIES)[number]["code"];

const CODES = new Set<string>(WEST_AFRICA_CURRENCIES.map((c) => c.code));

export function isWestAfricaCurrencyCode(value: string): value is WestAfricaCurrencyCode {
  return CODES.has(value.trim().toUpperCase());
}

export function normalizeWestAfricaCurrency(value: string): WestAfricaCurrencyCode | "" {
  const upper = value.trim().toUpperCase();
  return isWestAfricaCurrencyCode(upper) ? upper : "";
}

export function westAfricaCurrencyLabel(code: string): string {
  const found = WEST_AFRICA_CURRENCIES.find((c) => c.code === code.trim().toUpperCase());
  return found?.label ?? code;
}

/** Shown on store forms — Lynk Assistant replies 24/7; hours are for owner escalations. */
export const OWNER_AVAILABILITY_HOURS_LABEL = "Your availability for escalations";
export const OWNER_AVAILABILITY_HOURS_HINT =
  "Lynk Assistant replies to customers 24/7. These hours are when you (or your team) can pick up owner follow-ups and handoffs — not when the bot stops.";
