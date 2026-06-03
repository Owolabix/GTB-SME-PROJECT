import {
  isInstagramConnectedForUser,
  isStoreSetupCompleteForUser,
  SETUP_ENTRY_PATH,
} from "@/lib/storeSetup";

export type PostAuthPath = "/dashboard" | "/integrations" | "/onboarding";

/** Where to send a signed-in user after login. */
export async function getPostAuthPath(userId: string): Promise<PostAuthPath> {
  if (await isStoreSetupCompleteForUser(userId)) return "/dashboard";
  if (await isInstagramConnectedForUser(userId)) return "/onboarding";
  return SETUP_ENTRY_PATH;
}
