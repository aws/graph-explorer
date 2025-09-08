import { createResultEdge } from "./edge";

describe("createResultEdge", () => {
  it("should create an edge where the nodes have a single type", () => {
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {
        since: "2020-01-01",
      },
    });
  });

  it("should create an edge where the nodes have multiple types", () => {
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {
        since: "2020-01-01",
      },
    });
  });

  it("should create an edge where the nodes have no types", () => {
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
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
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
    });
  });

  it("should create an edge with no attributes", () => {
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {},
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {},
    });
  });

  it("should create an edge with attributes as a map", () => {
    const edge = createResultEdge({
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {
        since: "2020-01-01",
        until: "2020-01-02",
        years: 11,
        sameDept: true,
      },
    });

    expect(edge).toStrictEqual({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: {
        since: "2020-01-01",
        until: "2020-01-02",
        years: 11,
        sameDept: true,
      },
    });
  });
});
