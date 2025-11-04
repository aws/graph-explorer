export function parseNumberSafely(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
}
