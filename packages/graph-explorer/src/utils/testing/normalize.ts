/**
 * Reduces all whitespace in a string to a single space.
 * @param str The string to be normalized.
 * @returns A whitespace normalized string.
 */
export function normalize(str: string) {
  return (
    str
      // Remove any line beginning with `#`
      .replace(/^[#].*/g, "")
      // Replace any whitespace with a single space
      .replace(/\s+/g, " ")
      // Trim leading and trailing whitespace
      .trim()
  );
}

/**
 * Removes all whitespace.
 * @param str The string to be normalized.
 * @returns A whitespace normalized string.
 */
export function normalizeWithNoSpace(str: string) {
  return str.replace(/\s+/g, "");
}
