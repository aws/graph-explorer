import type { IriNamespace } from "./types";

import {
  commonPrefixesByNamespace,
  normalizeNamespace,
} from "./commonPrefixes";

describe("normalizeNamespace", () => {
  it("lowercases the namespace", () => {
    expect(normalizeNamespace("HTTP://Example.ORG/" as IriNamespace)).toBe(
      "http://example.org/",
    );
  });

  it("trims whitespace", () => {
    expect(normalizeNamespace("  http://example.org/  " as IriNamespace)).toBe(
      "http://example.org/",
    );
  });

  it("handles already normalized namespaces", () => {
    expect(normalizeNamespace("http://example.org/" as IriNamespace)).toBe(
      "http://example.org/",
    );
  });
});

describe("commonPrefixesByNamespace", () => {
  it("contains well-known RDF prefixes", () => {
    expect(
      commonPrefixesByNamespace.get(
        normalizeNamespace("http://www.w3.org/2002/07/owl#" as IriNamespace),
      ),
    ).toBe("owl");
    expect(
      commonPrefixesByNamespace.get(
        normalizeNamespace(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#" as IriNamespace,
        ),
      ),
    ).toBe("rdf");
  });

  it("matches case-insensitively via normalizeNamespace", () => {
    expect(
      commonPrefixesByNamespace.get(
        normalizeNamespace("HTTP://WWW.W3.ORG/2002/07/OWL#" as IriNamespace),
      ),
    ).toBe("owl");
  });

  it("returns undefined for unknown namespaces", () => {
    expect(
      commonPrefixesByNamespace.get(
        normalizeNamespace("http://unknown.example.org/" as IriNamespace),
      ),
    ).toBeUndefined();
  });
});
