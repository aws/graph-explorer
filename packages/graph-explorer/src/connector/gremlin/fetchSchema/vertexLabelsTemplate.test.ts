import { describe, expect, it } from "vite-plus/test";

import vertexLabelsTemplate from "./vertexLabelsTemplate";

describe("Gremlin > vertexLabelsTemplate", () => {
  it("emits the exact query text", () => {
    expect(vertexLabelsTemplate()).toBe("g.V().groupCount().by(label)");
  });
});
