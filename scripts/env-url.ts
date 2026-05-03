/** Match Vercel `src/db` — strip accidental wrapping quotes from pasted DATABASE_URL. */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  if (!raw) return "";
  let u = raw.trim();
  if (
    (u.startsWith('"') && u.endsWith('"')) ||
    (u.startsWith("'") && u.endsWith("'"))
  ) {
    u = u.slice(1, -1).trim();
  }
  return u;
}
