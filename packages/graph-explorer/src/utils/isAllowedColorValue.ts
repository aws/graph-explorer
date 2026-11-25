import Color from "color";

/**
 * Whether a value is a color the app can render: a hex, `rgb()`, `hsl()`,
 * `hwb()`, or named color. Anything else, such as a `url()` reference, a
 * `var()`, or a declaration list, is not a color. Every write and load path
 * shares this one gate so the accepted set cannot drift.
 *
 * The value is tested as written, since the renderers cannot read padding. A
 * caller that accepts padded input trims it first.
 */
export function isAllowedColorValue(value: string): boolean {
  try {
    new Color(value);
    return true;
  } catch {
    return false;
  }
}
