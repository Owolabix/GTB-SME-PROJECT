import { completeInstagramConnect } from "@/integrations/instagram/connectInstagram";
import { getMetaOAuthRedirectUri } from "@/integrations/instagram/metaRedirectUri";
import { supabase } from "@/integrations/supabase/client";

export type FinishMetaConnectResult =
  | { ok: true }
  | { ok: false; message: string };

/** Exchange Meta OAuth code after Supabase session is available. */
export async function finishMetaInstagramConnect(
  code: string,
  state: string,
): Promise<FinishMetaConnectResult> {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (sessionErr || !token) {
    return { ok: false, message: "You must be signed in to finish connecting Instagram." };
  }

  try {
    const result = await completeInstagramConnect({
      data: {
        accessToken: token,
        code,
        state,
        redirectUri: getMetaOAuthRedirectUri(),
      },
    });
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message:
        msg === "Failed to fetch" || msg.includes("fetch")
          ? "Could not reach the server to exchange the Meta code. Restart npm run dev and try Connect again."
          : msg,
    };
  }
}
