import { describe, expect, it } from "vite-plus/test";

import predicatesWithCountsTemplate from "./predicatesWithCountsTemplate";

describe("SPARQL > predicatesWithCountsTemplate", () => {
  it("emits the exact query text", () => {
    expect(predicatesWithCountsTemplate()).toBe(
      [
        "# Fetch all distinct predicates to non-literals with counts",
        "SELECT ?predicate (COUNT(?predicate) as ?count) {",
        "  [] ?predicate ?object FILTER(!isLiteral(?object))",
        "} GROUP BY ?predicate",
      ].join("\n"),
    );
  });
});
