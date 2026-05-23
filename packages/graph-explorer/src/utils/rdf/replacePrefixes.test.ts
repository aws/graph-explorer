import type { PrefixTypeConfig } from "@/core";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { PrefixLookup } from "./PrefixLookup";
import replacePrefixes from "./replacePrefixes";

const emptyLookup = PrefixLookup.fromArray([]);

function toLookup(prefixes: PrefixTypeConfig[]): PrefixLookup {
  return PrefixLookup.fromArray(prefixes);
}

test("should return the URI when it is not a valid IRI", () => {
  expect(replacePrefixes("not-a-url", emptyLookup)).toBe("not-a-url");
  expect(replacePrefixes("just text", emptyLookup)).toBe("just text");
});

test("should return the URI when no prefix matches", () => {
  const result = replacePrefixes(
    "http://unknown.example.org/ns/Thing",
    emptyLookup,
  );
  expect(result).toBe("http://unknown.example.org/ns/Thing");
});

test("should replace using common prefixes", () => {
  const result = replacePrefixes(
    "http://www.w3.org/2002/07/owl#ObjectProperty",
    emptyLookup,
  );
  expect(result).toBe("owl:ObjectProperty");
});

test("should replace using custom prefixes", () => {
  const result = replacePrefixes(
    "http://example.com/foo/bar",
    toLookup([
      {
        prefix: "foo" as RdfPrefix,
        uri: "http://example.com/foo/" as IriNamespace,
      },
    ]),
  );
  expect(result).toBe("foo:bar");
});

test("should use generated prefixes", () => {
  const result = replacePrefixes(
    "http://foo.com/foo/bar",
    toLookup([
      {
        prefix: "foo" as RdfPrefix,
        uri: "http://foo.com/foo/" as IriNamespace,
        __inferred: true,
      },
    ]),
  );
  expect(result).toBe("foo:bar");
});

test("should prefer custom prefixes over common prefixes", () => {
  const result = replacePrefixes(
    "http://www.w3.org/2002/07/owl#ObjectProperty",
    toLookup([
      {
        prefix: "myowl" as RdfPrefix,
        uri: "http://www.w3.org/2002/07/owl#" as IriNamespace,
      },
    ]),
  );
  expect(result).toBe("myowl:ObjectProperty");
});

test("should prefer common prefixes over generated prefixes", () => {
  const result = replacePrefixes(
    "http://www.w3.org/2002/07/owl#ObjectProperty",
    toLookup([
      {
        prefix: "gen" as RdfPrefix,
        uri: "http://www.w3.org/2002/07/owl#" as IriNamespace,
        __inferred: true,
      },
    ]),
  );
  expect(result).toBe("owl:ObjectProperty");
});

test("should match namespace case-insensitively", () => {
  expect(
    replacePrefixes(
      "HTTP://www.w3.org/2002/07/owl#ObjectProperty",
      emptyLookup,
    ),
  ).toBe("owl:ObjectProperty");
  expect(
    replacePrefixes(
      "http://WWW.W3.ORG/2002/07/owl#ObjectProperty",
      emptyLookup,
    ),
  ).toBe("owl:ObjectProperty");
});

test("should preserve the original casing of the local value", () => {
  expect(
    replacePrefixes(
      "http://www.w3.org/2002/07/owl#objectproperty",
      emptyLookup,
    ),
  ).toBe("owl:objectproperty");
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * PrefixTypeConfig is persisted to IndexedDB via localforage. Older versions
 * stored a `__matches` property (Set<string>) on inferred prefixes. That
 * property has been removed from the type, but previously persisted data may
 * still contain it. These tests verify that replacePrefixes continues to work
 * correctly when given data in the old shape.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
test("should replace using legacy inferred prefix with __matches", () => {
  const result = replacePrefixes(
    "http://legacy.com/ns/Thing",
    toLookup([
      {
        prefix: "legacy" as RdfPrefix,
        uri: "http://legacy.com/ns/" as IriNamespace,
        __inferred: true,
        __matches: new Set(["http://legacy.com/ns/Thing"]),
      } as PrefixTypeConfig,
    ]),
  );
  expect(result).toBe("legacy:Thing");
});
