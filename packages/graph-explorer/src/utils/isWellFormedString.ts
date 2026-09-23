const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;
const LOW_SURROGATE_START = 0xdc00;
const LOW_SURROGATE_END = 0xdfff;

function isHighSurrogate(code: number): boolean {
  return code >= HIGH_SURROGATE_START && code <= HIGH_SURROGATE_END;
}

function isLowSurrogate(code: number): boolean {
  return code >= LOW_SURROGATE_START && code <= LOW_SURROGATE_END;
}

/**
 * Returns `true` if the string contains no unpaired UTF-16 surrogates.
 *
 * This is a browser-floor-safe replacement for `String.prototype.isWellFormed()`,
 * which is not available in Firefox 114.
 */
export function isWellFormedString(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    if (isHighSurrogate(code)) {
      const nextCode = value.charCodeAt(i + 1);
      if (!isLowSurrogate(nextCode)) {
        return false;
      }
      i++;
    } else if (isLowSurrogate(code)) {
      return false;
    }
  }

  return true;
}
