import type { PrefixTypeConfig } from "@/core";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { PrefixLookup } from "./PrefixLookup";

function userPrefix(prefix: string, uri: string): PrefixTypeConfig {
  return { prefix: prefix as RdfPrefix, uri: uri as IriNamespace };
}

function inferredPrefix(prefix: string, uri: string): PrefixTypeConfig {
  return {
    prefix: prefix as RdfPrefix,
    uri: uri as IriNamespace,
    __inferred: true,
  };
}

describe("PrefixLookup", () => {
  it("should be created from an empty array", () => {
    const lookup = PrefixLookup.fromArray([]);
    expect(lookup.userPrefixes).toEqual([]);
    expect(lookup.inferredPrefixes).toEqual([]);
  });

  it("should separate user and inferred prefixes", () => {
    const user = userPrefix("foo", "http://foo.com/");
    const inferred = inferredPrefix("bar", "http://bar.com/");
    const lookup = PrefixLookup.fromArray([user, inferred]);
    expect(lookup.userPrefixes).toEqual([user]);
    expect(lookup.inferredPrefixes).toEqual([inferred]);
  });

  it("should include all inferred prefixes", () => {
    const first = inferredPrefix("bar", "http://bar.com/");
    const second = inferredPrefix("empty", "http://empty.com/");
    const lookup = PrefixLookup.fromArray([first, second]);
    expect(lookup.inferredPrefixes).toEqual([first, second]);
  });

  describe("findPrefix", () => {
    it("should find a user prefix by namespace", () => {
      const lookup = PrefixLookup.fromArray([
        userPrefix("foo", "http://foo.com/"),
      ]);
      expect(lookup.findPrefix("http://foo.com/" as IriNamespace)).toBe("foo");
    });

    it("should find an inferred prefix by namespace", () => {
      const lookup = PrefixLookup.fromArray([
        inferredPrefix("bar", "http://bar.com/"),
      ]);
      expect(lookup.findPrefix("http://bar.com/" as IriNamespace)).toBe("bar");
    });

    it("should find a common prefix by namespace", () => {
      const lookup = PrefixLookup.fromArray([]);
      expect(
        lookup.findPrefix("http://www.w3.org/2002/07/owl#" as IriNamespace),
      ).toBe("owl");
    });

    it("should match namespace case-insensitively", () => {
      const lookup = PrefixLookup.fromArray([
        userPrefix("foo", "http://FOO.com/"),
      ]);
      expect(lookup.findPrefix("http://foo.com/" as IriNamespace)).toBe("foo");
    });

    it("should return undefined when no prefix matches", () => {
      const lookup = PrefixLookup.fromArray([]);
      expect(
        lookup.findPrefix("http://unknown.com/" as IriNamespace),
      ).toBeUndefined();
    });

    it("should prefer user prefix over common prefix", () => {
      const lookup = PrefixLookup.fromArray([
        userPrefix("myowl", "http://www.w3.org/2002/07/owl#"),
      ]);
      expect(
        lookup.findPrefix("http://www.w3.org/2002/07/owl#" as IriNamespace),
      ).toBe("myowl");
    });

    it("should prefer common prefix over inferred prefix", () => {
      const lookup = PrefixLookup.fromArray([
        inferredPrefix("gen", "http://www.w3.org/2002/07/owl#"),
      ]);
      expect(
        lookup.findPrefix("http://www.w3.org/2002/07/owl#" as IriNamespace),
      ).toBe("owl");
    });
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * PrefixTypeConfig is persisted to IndexedDB via localforage. Older versions
 * stored a `__matches` property (Set<string>) on inferred prefixes. That
 * property has been removed from the type, but previously persisted data may
 * still contain it. These tests verify that PrefixLookup continues to work
 * correctly when given data in the old shape.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
describe("backward compatibility: legacy __matches property", () => {
  it("should handle inferred prefix with legacy __matches Set", () => {
    // Simulates data loaded from IndexedDB that was persisted before
    // __matches was removed from PrefixTypeConfig.
    const legacyPrefix = {
      prefix: "soccer" as RdfPrefix,
      uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
      __inferred: true,
      __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
    } as PrefixTypeConfig;

    const lookup = PrefixLookup.fromArray([legacyPrefix]);

    expect(lookup.inferredPrefixes).toHaveLength(1);
    expect(
      lookup.findPrefix(
        "http://www.example.com/soccer/ontology/" as IriNamespace,
      ),
    ).toBe("soccer");
  });

  it("should handle mix of legacy and current prefix shapes", () => {
    // Legacy inferred prefix with __matches (old shape)
    const legacyInferred = {
      prefix: "old" as RdfPrefix,
      uri: "http://old.example.com/" as IriNamespace,
      __inferred: true,
      __matches: new Set(["http://old.example.com/Thing"]),
    } as PrefixTypeConfig;

    // Current inferred prefix without __matches (new shape)
    const currentInferred = inferredPrefix("new", "http://new.example.com/");

    // User prefix (never had __matches)
    const user = userPrefix("custom", "http://custom.example.com/");

    const lookup = PrefixLookup.fromArray([
      legacyInferred,
      currentInferred,
      user,
    ]);

    expect(lookup.inferredPrefixes).toHaveLength(2);
    expect(lookup.userPrefixes).toHaveLength(1);
    expect(lookup.findPrefix("http://old.example.com/" as IriNamespace)).toBe(
      "old",
    );
    expect(lookup.findPrefix("http://new.example.com/" as IriNamespace)).toBe(
      "new",
    );
    expect(
      lookup.findPrefix("http://custom.example.com/" as IriNamespace),
    ).toBe("custom");
  });
});
