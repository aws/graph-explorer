import { describe, expect, it } from "vite-plus/test";

import classesWithCountsTemplates from "./classesWithCountsTemplates";

describe("SPARQL > classesWithCountsTemplates", () => {
  it("emits the exact query text", () => {
    expect(classesWithCountsTemplates()).toBe(
      [
        "# Fetch a list of classes with the number of instances for each class",
        "SELECT ?class  (COUNT(?start) AS ?instancesCount) {",
        "  ?start a ?class",
        "}",
        "GROUP BY ?class",
      ].join("\n"),
    );
  });
});
