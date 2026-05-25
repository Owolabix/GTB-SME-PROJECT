/** Forward a single unmatched DM to the CX-Assistant Express service (Gemini AI). */
export async function forwardDmToCxAssistant(opts: {
  merchantScopedId: string;
  event: unknown;
}): Promise<boolean> {
  const base = process.env.CX_ASSISTANT_URL?.replace(/\/$/, "");
  const secret = process.env.CX_ASSISTANT_INTERNAL_SECRET;
  if (!base || !secret) {
    return false;
  }

  try {
    const res = await fetch(`${base}/internal/dm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cx-internal-secret": secret,
      },
      body: JSON.stringify(opts),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[cx-assistant] forward failed (${res.status}):`, text);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cx-assistant] forward error:", e);
    return false;
  }
}
