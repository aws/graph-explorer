import type { PrefixTypeConfig } from "@/core";

import type { PrefixLookup } from "./PrefixLookup";
import type { RdfPrefix } from "./types";
import type { NormalizedIriNamespace } from "./types";

import { normalizeNamespace } from "./commonPrefixes";
import { generatePrefix } from "./generatePrefix";
import { splitIri } from "./splitIri";

/**
 * Finds namespaces in the given IRIs that have no matching prefix in the
 * lookup, generates a prefix for each, and returns the new prefix configs.
 *
 * Returns an empty array when every IRI already has a matching prefix.
 */
export default function generatePrefixes(
  iris: Set<string>,
  existingPrefixes: PrefixLookup,
): PrefixTypeConfig[] {
  const newPrefixes = new Map<NormalizedIriNamespace, PrefixTypeConfig>();
  const usedNames = new Set<RdfPrefix>(
    [
      ...existingPrefixes.userPrefixes,
      ...existingPrefixes.inferredPrefixes,
    ].map(p => p.prefix),
  );

  for (const iri of iris) {
    const parts = splitIri(iri);
    if (!parts) {
      continue;
    }

    const normalizedNamespace = normalizeNamespace(parts.namespace);

    // Already covered by an existing prefix
    if (existingPrefixes.findPrefix(parts.namespace)) {
      continue;
    }

    // Already generated in this batch
    if (newPrefixes.has(normalizedNamespace)) {
      continue;
    }

    const generated = generatePrefix(iri);
    if (!generated) {
      continue;
    }

    const uniqueName = makeUnique(generated.prefix, usedNames);
    usedNames.add(uniqueName);

    newPrefixes.set(normalizedNamespace, {
      __inferred: true,
      prefix: uniqueName,
      uri: generated.namespace,
    });
  }

  return newPrefixes.values().toArray();
}

/**
 * Appends an incrementing numeral to ensure the prefix name is unique within
 * the given set.
 */
function makeUnique(prefix: RdfPrefix, used: Set<RdfPrefix>): RdfPrefix {
  if (!used.has(prefix)) {
    return prefix;
  }
  // Start at 2 because the unsuffixed prefix is implicitly "1"
  let i = 2;
  while (used.has(`${prefix}${i}` as RdfPrefix)) {
    i++;
  }
  return `${prefix}${i}` as RdfPrefix;
}
