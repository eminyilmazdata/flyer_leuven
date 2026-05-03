/** Next.js `searchParams` values may be `string | string[]`. */
export function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function decodeQueryError(
  value: string | string[] | undefined,
): string | null {
  const raw = firstQueryValue(value);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
