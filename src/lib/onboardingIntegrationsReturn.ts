/** Persisted across Meta OAuth redirect (query params are cleared). */
export const ONBOARDING_RETURN_STORAGE_KEY = "lynk_return_after_integrations";

export const ONBOARDING_RETURN_SEARCH = "onboarding" as const;

export type IntegrationsReturnTo = typeof ONBOARDING_RETURN_SEARCH;

export function markIntegrationsReturnToOnboarding(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ONBOARDING_RETURN_STORAGE_KEY, "/onboarding");
}

export function clearIntegrationsReturnToOnboarding(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_RETURN_STORAGE_KEY);
}

export function shouldReturnToOnboardingAfterIntegrations(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(ONBOARDING_RETURN_STORAGE_KEY) === "/onboarding";
}

export function isOnboardingReturnSearch(
  returnTo: string | undefined,
): returnTo is IntegrationsReturnTo {
  return returnTo === ONBOARDING_RETURN_SEARCH;
}
