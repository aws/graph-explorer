import { describe, expect, it } from "vite-plus/test";

import { query } from "@/utils";

import classWithCountsTemplates from "./classWithCountsTemplates";

describe("SPARQL > classWithCountsTemplates", () => {
  it("should count the instances of the given class", () => {
    const template = classWithCountsTemplates("http://example.org/Airport");

    expect(template).toBe(query`
      # Fetch the number of instances of the given class
      SELECT (COUNT(?start) AS ?instancesCount) {
        ?start a <http://example.org/Airport>
      }
    `);
  });

  it("emits the exact query text", () => {
    expect(classWithCountsTemplates("http://e/c1")).toBe(
      [
        "# Fetch the number of instances of the given class",
        "SELECT (COUNT(?start) AS ?instancesCount) {",
        "  ?start a <http://e/c1>",
        "}",
      ].join("\n"),
    );
  });
});
