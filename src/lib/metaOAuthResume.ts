/** Resume Meta OAuth on /login using dedicated search params (not a nested `next` URL). */
export const META_OAUTH_LOGIN_FLAG = "meta" as const;

export type MetaOAuthLoginSearch = {
  oauth?: typeof META_OAUTH_LOGIN_FLAG;
  code?: string;
  state?: string;
};

export function metaOAuthParamsFromSearch(
  search: MetaOAuthLoginSearch,
): { code: string; state: string } | null {
  if (search.oauth !== META_OAUTH_LOGIN_FLAG) return null;
  const code = search.code?.trim();
  const state = search.state?.trim();
  if (!code || !state) return null;
  return { code, state };
}

export function metaOAuthParamsFromLocationSearch(searchStr: string): { code: string; state: string } | null {
  const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const code = params.get("code")?.trim();
  const state = params.get("state")?.trim();
  if (!code || !state) return null;
  return { code, state };
}
