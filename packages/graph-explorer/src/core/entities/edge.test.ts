import { createEdge } from "./edge";

describe("createEdge", () => {
  it("should create an edge with attributes", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {
        since: "2020-01-01",
      },
    });
  });

  it("should create an edge with missing attributes", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {},
    });
  });

  it("should create an edge with no attributes", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {},
    });

    expect(edge).toStrictEqual({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {},
    });
  });
});
