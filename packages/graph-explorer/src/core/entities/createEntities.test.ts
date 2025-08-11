import { createEdge, createVertex } from "./createEntities";
import { EntityPropertyValue } from ".";

describe("createVertex", () => {
  it("should create a vertex with a single type", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
      __isFragment: false,
      __isBlank: false,
    });
  });

  it("should create a vertex with multiple types", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person", "Worker"],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person", "Worker"],
      attributes: {
        name: "Alice",
      },
      __isFragment: false,
      __isBlank: false,
    });
  });

  it("should create a vertex with no types", () => {
    const vertex = createVertex({
      id: "1",
      types: [],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "",
      types: [],
      attributes: {
        name: "Alice",
      },
      __isFragment: false,
      __isBlank: false,
    });
  });

  it("should create a vertex with missing attributes", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      __isFragment: true,
      __isBlank: false,
    });
  });

  it("should create a vertex with no attributes", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      __isFragment: false,
      __isBlank: false,
    });
  });

  it("should create a vertex with attributes as a map", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: new Map<string, EntityPropertyValue>([
        ["name", "Alice"],
        ["age", 30],
        ["isMarried", true],
      ]),
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
      __isFragment: false,
      __isBlank: false,
    });
  });

  it("should create a vertex with that is a blank node", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });

    expect(vertex).toMatchObject({
      entityType: "vertex",
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      __isFragment: false,
      __isBlank: true,
    });
  });
});

describe("createEdge", () => {
  it("should create an edge where the nodes have a single type", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      source: "1",
      target: "2",
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {
        since: "2020-01-01",
      },
      __isFragment: false,
    });
  });

  it("should create an edge where the nodes have multiple types", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      source: "1",
      target: "2",
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {
        since: "2020-01-01",
      },
      __isFragment: false,
    });
  });

  it("should create an edge where the nodes have no types", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      attributes: {
        since: "2020-01-01",
      },
      source: "1",
      target: "2",
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {
        since: "2020-01-01",
      },
      __isFragment: false,
    });
  });

  it("should create an edge with missing attributes", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {},
      __isFragment: true,
    });
  });

  it("should create an edge with no attributes", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {},
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {},
      __isFragment: false,
    });
  });

  it("should create an edge with attributes as a map", () => {
    const edge = createEdge({
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: new Map<string, EntityPropertyValue>([
        ["since", "2020-01-01"],
        ["until", "2020-01-02"],
        ["years", 11],
        ["sameDept", true],
      ]),
    });

    expect(edge).toMatchObject({
      entityType: "edge",
      id: "1",
      type: "WORKS_WITH",
      source: "1",
      target: "2",
      attributes: {
        since: "2020-01-01",
        until: "2020-01-02",
        years: 11,
        sameDept: true,
      },
      __isFragment: false,
    });
  });
});
