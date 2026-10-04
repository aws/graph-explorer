/**
 * With the `u` flag, paired surrogates match as one astral code point, so only
 * unpaired surrogates have the Surrogate (`Cs`) general category.
 */
const UNPAIRED_SURROGATE = /\p{Cs}/u;

/**
 * Returns `true` if the string contains no unpaired UTF-16 surrogates.
 *
 * Equivalent to `String.prototype.isWellFormed()`, which is not available in
 * Firefox 114.
 */
export function isWellFormedString(value: string): boolean {
  return !UNPAIRED_SURROGATE.test(value);
}
