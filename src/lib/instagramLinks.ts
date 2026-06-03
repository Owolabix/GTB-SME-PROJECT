/** Normalize @handle or username to bare Instagram username. */
export function normalizeInstagramUsername(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const u = value.trim().replace(/^@/, "");
  if (!u || u.startsWith("Customer ") || /^\d+$/.test(u)) return null;
  return u;
}

/** Opens DM compose on mobile; profile/message entry on web. */
export function instagramMessageUrl(username: string | null | undefined): string | null {
  const u = normalizeInstagramUsername(username);
  return u ? `https://ig.me/m/${encodeURIComponent(u)}` : null;
}

export function instagramProfileUrl(username: string | null | undefined): string | null {
  const u = normalizeInstagramUsername(username);
  return u ? `https://www.instagram.com/${encodeURIComponent(u)}/` : null;
}
