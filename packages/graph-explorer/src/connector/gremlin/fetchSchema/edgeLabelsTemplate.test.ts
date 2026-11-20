import { describe, expect, it } from "vite-plus/test";

import edgeLabelsTemplate from "./edgeLabelsTemplate";

describe("Gremlin > edgeLabelsTemplate", () => {
  it("emits the exact query text", () => {
    expect(edgeLabelsTemplate()).toBe("g.E().groupCount().by(label)");
  });
});
