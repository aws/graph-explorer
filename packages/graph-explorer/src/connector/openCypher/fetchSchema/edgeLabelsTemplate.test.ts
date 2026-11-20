import { describe, expect, it } from "vite-plus/test";

import edgeLabelsTemplate from "./edgeLabelsTemplate";

describe("OpenCypher > edgeLabelsTemplate", () => {
  it("emits the exact query text", () => {
    expect(edgeLabelsTemplate()).toBe(
      "MATCH ()-[e]-() RETURN type(e) AS label, count(*) AS count",
    );
  });
});
