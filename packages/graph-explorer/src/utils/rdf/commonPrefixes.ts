import type { IriNamespace, NormalizedIriNamespace, RdfPrefix } from "./types";

import rawPrefixes from "./common-prefixes.json";

/** Lowercases and trims a namespace for case-insensitive map lookups. */
export function normalizeNamespace(
  namespace: IriNamespace,
): NormalizedIriNamespace {
  return namespace.toLowerCase().trim() as NormalizedIriNamespace;
}

/** Maps normalized namespace URI → prefix name for all common prefixes. */
export const commonPrefixesByNamespace = new Map<
  NormalizedIriNamespace,
  RdfPrefix
>(
  Object.entries(rawPrefixes).map(([prefix, uri]) => [
    normalizeNamespace(uri as IriNamespace),
    prefix as RdfPrefix,
  ]),
);
