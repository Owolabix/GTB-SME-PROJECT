import { supabase } from "@/integrations/supabase/client";

/** Supabase session lives in localStorage — unavailable during SSR. */
export function isBrowserAuthContext(): boolean {
  return typeof window !== "undefined";
}

export async function getClientSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}
