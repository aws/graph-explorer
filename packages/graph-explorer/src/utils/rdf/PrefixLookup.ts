import type { PrefixTypeConfig } from "@/core/ConfigurationProvider/types";

import type { IriNamespace, NormalizedIriNamespace, RdfPrefix } from "./types";

import {
  commonPrefixesByNamespace,
  normalizeNamespace,
} from "./commonPrefixes";

/**
 * Provides fast Map-based lookups over a PrefixTypeConfig array.
 *
 * Separates user-created and inferred prefixes and normalizes namespaces
 * for case-insensitive matching. When multiple prefixes share the same
 * normalized namespace within a category (user or inferred), the last one
 * in the input array wins.
 */
export class PrefixLookup {
  private readonly userMap: Map<NormalizedIriNamespace, PrefixTypeConfig>;
  private readonly inferredMap: Map<NormalizedIriNamespace, PrefixTypeConfig>;

  /** User-created prefixes (not inferred). */
  readonly userPrefixes: PrefixTypeConfig[];
  /** Inferred prefixes. */
  readonly inferredPrefixes: PrefixTypeConfig[];

  private constructor(prefixes: PrefixTypeConfig[]) {
    this.userMap = new Map();
    this.inferredMap = new Map();

    for (const p of prefixes) {
      const key = normalizeNamespace(p.uri);
      if (p.__inferred) {
        this.inferredMap.set(key, p);
      } else {
        this.userMap.set(key, p);
      }
    }

    this.userPrefixes = [...this.userMap.values()];
    this.inferredPrefixes = [...this.inferredMap.values()];
  }

  static fromArray(prefixes: PrefixTypeConfig[]): PrefixLookup {
    return new PrefixLookup(prefixes);
  }

  /**
   * Finds the best matching prefix name for the given namespace.
   *
   * Priority order: user-created > common > inferred.
   */
  findPrefix(namespace: IriNamespace): RdfPrefix | undefined {
    const normalizedNamespace = normalizeNamespace(namespace);

    // Prefixes priority:
    // 1. manually added (user)
    // 2. common prefixes
    // 3. automatically generated (inferred)
    return (
      this.userMap.get(normalizedNamespace)?.prefix ??
      commonPrefixesByNamespace.get(normalizedNamespace) ??
      this.inferredMap.get(normalizedNamespace)?.prefix
    );
  }
}
