/**
 * Reduces all whitespace in a string to a single space.
 * @param str The string to be normalized.
 * @returns A whitespace normalized string.
 */
export default function normalize(str: string) {
  return str.replace(/\s+/g, " ").trim();
}
