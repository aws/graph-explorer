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

/**
 * Reduces all whitespace in a string to a single space and normalizes line endings.
 * @param str The string to be normalized.
 * @returns A whitespace and newline normalized string.
 */
export function normalizeWithNewlines(str: string) {
  return (
    str
      // Remove any line beginning with `#` with or without whitespace in front
      .replace(/^\s*#.*$/gm, "")
      // Replace any line ending with a normalized line ending
      .replace(/\r\n|\r|\n/g, "\n")
      // Removes any empty lines
      .replace(/^\s*\n/gm, "")
      // Trim leading and trailing whitespace
      .trim()
  );
}
