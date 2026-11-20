import { describe, expect, it } from "vite-plus/test";

import vertexLabelsTemplate from "./vertexLabelsTemplate";

describe("OpenCypher > vertexLabelsTemplate", () => {
  it("emits the exact query text", () => {
    expect(vertexLabelsTemplate()).toBe(
      "MATCH (v) RETURN labels(v) AS label, count(v) AS count",
    );
  });
});
