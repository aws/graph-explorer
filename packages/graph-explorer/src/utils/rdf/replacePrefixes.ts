import type { PrefixLookup } from "./PrefixLookup";

import { splitIri } from "./splitIri";

/**
 * Replaces the namespace portion of an IRI with a short prefix if one is found
 * in the given lookup. Returns the original string when no match exists.
 */
export default function replacePrefixes(
  uri: string | undefined,
  prefixes: PrefixLookup,
): string {
  if (!uri) {
    return "";
  }

  const iriParts = splitIri(uri);
  if (!iriParts) {
    return uri;
  }

  const prefixMatch = prefixes.findPrefix(iriParts.namespace);

  if (!prefixMatch) {
    return uri;
  }

  return `${prefixMatch}:${iriParts.value}`;
}
