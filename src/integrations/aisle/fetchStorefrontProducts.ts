import type { AisleCatalogueError, AisleCatalogueResponse } from "@/integrations/aisle/types";

const DEFAULT_AISLE_PRODUCTS_URL = "https://aisle-sandy.vercel.app/api/storefront/products";

export function normalizeAisleInstagram(handle: string | null | undefined): string | null {
  if (!handle?.trim()) return null;
  return handle.trim().replace(/^@/, "");
}

export function aisleProductsApiUrl(): string {
  const explicit = process.env.AISLE_STOREFRONT_API_URL?.trim();
  if (explicit) return explicit;
  const base = process.env.STOREFRONT_API_BASE_URL?.trim()?.replace(/\/$/, "");
  if (base) return `${base}/api/storefront/products`;
  return DEFAULT_AISLE_PRODUCTS_URL;
}

export function aisleApiKey(): string | null {
  return (
    process.env.AISLE_API_KEY?.trim() ||
    process.env.STOREFRONT_API_KEY?.trim() ||
    null
  );
}

export type FetchAisleCatalogueOpts = {
  instagram?: string | null;
  storeId?: string | null;
  apiUrl?: string;
  apiKey?: string;
  signal?: AbortSignal;
};

export async function fetchAisleStorefrontProducts(
  opts: FetchAisleCatalogueOpts,
): Promise<AisleCatalogueResponse> {
  const instagram = normalizeAisleInstagram(opts.instagram);
  const storeId = opts.storeId?.trim() || null;

  if (!instagram && !storeId) {
    throw new Error("Provide either instagram or store_id to fetch AISLE products.");
  }

  const apiKey = opts.apiKey ?? aisleApiKey();
  if (!apiKey) {
    throw new Error("AISLE API key is not configured (AISLE_API_KEY or STOREFRONT_API_KEY).");
  }

  const baseUrl = opts.apiUrl ?? aisleProductsApiUrl();
  const url = new URL(baseUrl);
  if (instagram) url.searchParams.set("instagram", instagram);
  if (storeId) url.searchParams.set("store_id", storeId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "x-api-key": apiKey },
    signal: opts.signal,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(`AISLE storefront API returned non-JSON (${res.status}).`);
  }

  if (!res.ok) {
    const err = body as AisleCatalogueError;
    throw new Error(err.error ?? `AISLE storefront API error (${res.status}).`);
  }

  return body as AisleCatalogueResponse;
}

/** Plain-text block for CX-Assistant / Gemini prompts. */
export function formatAisleCatalogueForPrompt(data: AisleCatalogueResponse): string {
  const lines = [
    `Store: ${data.store.business_name} (@${data.store.instagram_handle})`,
    `Products (${data.total}):`,
  ];

  if (data.products.length === 0) {
    lines.push("- (no products listed)");
    return lines.join("\n");
  }

  for (const p of data.products) {
    const avail = p.available ? "in stock" : "unavailable";
    const desc = p.description?.trim() ? ` — ${p.description.trim()}` : "";
    lines.push(`- ${p.name}: ${p.price}${desc} (${avail})`);
  }

  return lines.join("\n");
}
