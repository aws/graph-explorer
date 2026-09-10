import { DEFAULT_GRAPH_LAYOUT, isLayoutName, layoutNames } from "./graphLayout";

describe("graph layout vocabulary", () => {
  it("defines F_COSE as the default layout", () => {
    expect(DEFAULT_GRAPH_LAYOUT).toBe("F_COSE");
  });

  it("recognizes every supported layout name", () => {
    expect(layoutNames.every(isLayoutName)).toBe(true);
  });

  it("rejects an unsupported layout name", () => {
    expect(isLayoutName("UNSUPPORTED_LAYOUT")).toBe(false);
  });
});
