import type { PrefixTypeConfig } from "@/core";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import generatePrefixes from "./generatePrefixes";
import { PrefixLookup } from "./PrefixLookup";

describe("generatePrefixes", () => {
  it("should return empty when all IRIs already have prefixes", () => {
    const existing = PrefixLookup.fromArray([
      {
        prefix: "soccer-o" as RdfPrefix,
        uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
        __inferred: true,
      },
    ]);

    const result = generatePrefixes(
      new Set(["http://www.example.com/soccer/ontology/League"]),
      existing,
    );

    expect(result).toStrictEqual([]);
  });

  it("should return empty when all IRIs match common prefixes", () => {
    const result = generatePrefixes(
      new Set(["http://www.w3.org/2002/07/owl#ObjectProperty"]),
      PrefixLookup.fromArray([]),
    );
    expect(result).toStrictEqual([]);
  });

  it("should return empty when all IRIs match user prefixes", () => {
    const result = generatePrefixes(
      new Set(["https://dbpedia.org/resource/Qualifying_Rounds"]),
      PrefixLookup.fromArray([
        {
          prefix: "dbr" as RdfPrefix,
          uri: "https://dbpedia.org/resource/" as IriNamespace,
        },
      ]),
    );
    expect(result).toStrictEqual([]);
  });

  it("should generate prefixes for unmatched namespaces only", () => {
    const result = generatePrefixes(
      new Set([
        "http://www.w3.org/2002/07/owl#ObjectProperty",
        "http://www.example.com/soccer/ontology/League",
        "http://www.example.com/soccer/resource#EPL",
      ]),
      PrefixLookup.fromArray([]),
    );

    expect(result).toStrictEqual([
      {
        __inferred: true,
        prefix: "soccer-o",
        uri: "http://www.example.com/soccer/ontology/",
      },
      {
        __inferred: true,
        prefix: "soccer-r",
        uri: "http://www.example.com/soccer/resource#",
      },
    ]);
  });

  it("should produce distinct prefixes for abbreviated segments without collisions", () => {
    const result = generatePrefixes(
      new Set([
        "http://www.example.com/soccer/ontology/A",
        "http://www.example.com/soccer/resource#B",
        "http://www.example.com/soccer/class#C",
      ]),
      PrefixLookup.fromArray([]),
    );

    const prefixes = result.map(r => r.prefix);
    expect(prefixes).toStrictEqual(["soccer-o", "soccer-r", "soccer-c"]);
  });

  it("should avoid collisions with existing prefixes", () => {
    const result = generatePrefixes(
      new Set(["http://example.com/sport/resource#EPL"]),
      PrefixLookup.fromArray([
        {
          prefix: "sport-r" as RdfPrefix,
          uri: "http://other.com/sport/resource/" as IriNamespace,
          __inferred: true,
        },
      ]),
    );

    expect(result).toStrictEqual([
      {
        __inferred: true,
        prefix: "sport-r2",
        uri: "http://example.com/sport/resource#",
      },
    ]);
  });

  it("should deduplicate namespaces within the batch", () => {
    const result = generatePrefixes(
      new Set([
        "http://www.example.com/location/resource#London",
        "http://www.example.com/location/resource#Manchester",
      ]),
      PrefixLookup.fromArray([]),
    );

    expect(result).toStrictEqual([
      {
        __inferred: true,
        prefix: "location-r",
        uri: "http://www.example.com/location/resource#",
      },
    ]);
  });

  it("should ignore file URIs", () => {
    const result = generatePrefixes(
      new Set(["file://foo/bar.txt"]),
      PrefixLookup.fromArray([]),
    );
    expect(result).toStrictEqual([]);
  });

  it("should ignore non-path URIs", () => {
    const result = generatePrefixes(
      new Set([
        "urn:Person",
        "urn:isbn:1234567890",
        "mailto:example@abc.com",
        "custom-scheme:foo",
      ]),
      PrefixLookup.fromArray([]),
    );
    expect(result).toStrictEqual([]);
  });

  it("should handle any pathed URI scheme", () => {
    const result = generatePrefixes(
      new Set(["ftp://foo/bar.txt"]),
      PrefixLookup.fromArray([]),
    );
    expect(result).toStrictEqual([
      {
        __inferred: true,
        prefix: "foo",
        uri: "ftp://foo/",
      },
    ]);
  });

  it("should match existing prefixes case-insensitively", () => {
    const result = generatePrefixes(
      new Set(["http://SecretSpyOrg/entity/quantity"]),
      PrefixLookup.fromArray([
        {
          __inferred: true,
          prefix: "ent" as RdfPrefix,
          uri: "http://secretspyorg/entity/" as IriNamespace,
        },
      ]),
    );

    expect(result).toStrictEqual([]);
  });

  it("should produce distinct prefixes for hash vs slash namespaces", () => {
    const result = generatePrefixes(
      new Set([
        "http://www.example.com/sport/ontology/League",
        "http://www.example.com/sport/resource#EPL",
        "http://www.example.com/sport/class#Team",
      ]),
      PrefixLookup.fromArray([]),
    );

    const prefixes = result.map(r => r.prefix);
    expect(prefixes).toStrictEqual(["sport-o", "sport-r", "sport-c"]);
  });

  it("should allow unique suffix to exceed 8 character prefix length", () => {
    const result = generatePrefixes(
      new Set([
        "http://www.example.com/abcdefgh/ontology/A",
        "http://www.example.com/abcdefgh/resource#B",
        "http://www.example.com/abcdefgh/class#C",
      ]),
      PrefixLookup.fromArray([]),
    );

    const prefixes = result.map(r => r.prefix);
    expect(prefixes).toStrictEqual(["abcdefgh-o", "abcdefgh-r", "abcdefgh-c"]);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * PrefixTypeConfig is persisted to IndexedDB via localforage. Older versions
 * stored a `__matches` property (Set<string>) on inferred prefixes. That
 * property has been removed from the type, but previously persisted data may
 * still contain it. These tests verify that generatePrefixes continues to work
 * correctly when the PrefixLookup is built from data in the old shape.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
describe("backward compatibility: legacy __matches property", () => {
  it("should recognize existing prefixes that have legacy __matches", () => {
    const legacyPrefixes = PrefixLookup.fromArray([
      {
        prefix: "soccer-o" as RdfPrefix,
        uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
        __inferred: true,
        __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
      } as PrefixTypeConfig,
    ]);

    const result = generatePrefixes(
      new Set(["http://www.example.com/soccer/ontology/Team"]),
      legacyPrefixes,
    );

    expect(result).toStrictEqual([]);
  });

  it("should generate new prefixes alongside legacy ones", () => {
    const legacyPrefixes = PrefixLookup.fromArray([
      {
        prefix: "soccer-o" as RdfPrefix,
        uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
        __inferred: true,
        __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
      } as PrefixTypeConfig,
    ]);

    const result = generatePrefixes(
      new Set([
        "http://www.example.com/soccer/ontology/Team",
        "http://www.example.com/location/resource#London",
      ]),
      legacyPrefixes,
    );

    expect(result).toStrictEqual([
      {
        __inferred: true,
        prefix: "location-r",
        uri: "http://www.example.com/location/resource#",
      },
    ]);
  });
});
