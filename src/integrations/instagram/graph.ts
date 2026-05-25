const GRAPH_VERSION = "v19.0";

export type SendInstagramDmResult =
  | { ok: true; messageId?: string }
  | { ok: false; message: string };

/** Send a DM via Instagram Messaging API (Page access token). */
export async function sendInstagramDm(
  pageAccessToken: string,
  recipientIgScopedId: string,
  text: string,
): Promise<SendInstagramDmResult> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`);
  url.searchParams.set("access_token", pageAccessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "instagram",
      recipient: { id: recipientIgScopedId },
      message: { text },
    }),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, message: "Meta send-message response was not JSON." };
  }

  if (!res.ok) {
    const err = body as { error?: { message?: string } };
    return { ok: false, message: err.error?.message ?? JSON.stringify(body) };
  }

  const ok = body as { message_id?: string };
  return { ok: true, messageId: ok.message_id };
}

/** Resolve Instagram @username for a customer PSID (best-effort; requires page token). */
export async function fetchInstagramUsername(
  pageAccessToken: string,
  igScopedUserId: string,
): Promise<string | null> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igScopedUserId}`);
  url.searchParams.set("fields", "username,name");
  url.searchParams.set("access_token", pageAccessToken);

  try {
    const res = await fetch(url.toString());
    const body = (await res.json()) as { username?: string; name?: string; error?: { message?: string } };
    if (!res.ok) return null;
    if (body.username) return body.username;
    if (body.name) return body.name.replace(/\s+/g, "").toLowerCase() || null;
    return null;
  } catch {
    return null;
  }
}
