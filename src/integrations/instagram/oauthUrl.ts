/**
 * Instagram Business / Creator access uses Meta’s **Facebook Login** OAuth URL.
 * The App ID and redirect URI are public; only the app secret stays on the server.
 */
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "business_management",
];

export function buildMetaOAuthUrlForInstagram(
  appId: string,
  redirectUri: string,
  stateUserId: string,
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: stateUserId,
    response_type: "code",
    scope: SCOPES.join(","),
    // Prefer full www.facebook.com dialog; mobile browsers otherwise use m.facebook.com
    // which can show "Feature Unavailable" while the app is in Development / under review.
    display: "page",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}
