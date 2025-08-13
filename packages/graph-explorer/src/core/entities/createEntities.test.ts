import {
  createResultEdge,
  createResultVertex,
  createVertex,
  createEdge,
} from "./createEntities";

describe("createResultVertex", () => {
  it("should create a vertex with a single type", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with multiple types", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person", "Worker"],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person", "Worker"],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with no types", () => {
    const vertex = createResultVertex({
      id: "1",
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: [],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with missing attributes", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person"],
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person"],
      attributes: null,
      isBlankNode: false,
    });
  });

  it("should create a vertex with no attributes", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person"],
      attributes: {},
      isBlankNode: false,
    });
  });

  it("should create a vertex with attributes as a map", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with that is a blank node", () => {
    const vertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });

    expect(vertex).toStrictEqual({
      entityType: "vertex",
      id: "1",
      name: null,
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });
  });
});

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
      name: null,
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
      name: null,
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
      name: null,
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
      name: null,
      type: "WORKS_WITH",
      sourceId: "1",
      targetId: "2",
      attributes: null,
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
      name: null,
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
      name: null,
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

describe("createVertex", () => {
  it("should create a vertex with a single type", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
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

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person", "Worker"],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with no types", () => {
    const vertex = createVertex({
      id: "1",
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "",
      types: [],
      attributes: {
        name: "Alice",
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex with missing attributes", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      isBlankNode: false,
    });
  });

  it("should create a vertex with no attributes", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      isBlankNode: false,
    });
  });

  it("should create a vertex with attributes as a map", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
      isBlankNode: false,
    });
  });

  it("should create a vertex that is a blank node", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });
  });

  it("should map a result vertex to vertex", () => {
    const resultVertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
    });

    expect(createVertex(resultVertex)).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {
        name: "Alice",
        age: 30,
        isMarried: true,
      },
      isBlankNode: false,
    });
  });

  it("should map result vertex that is a fragment", () => {
    const resultVertex = createResultVertex({
      id: "1",
      types: ["Person"],
    });

    expect(createVertex(resultVertex)).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      isBlankNode: false,
    });
  });

  it("should map result vertex that is a blank node", () => {
    const resultVertex = createResultVertex({
      id: "1",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });

    expect(createVertex(resultVertex)).toStrictEqual({
      id: "1",
      type: "Person",
      types: ["Person"],
      attributes: {},
      isBlankNode: true,
    });
  });
});

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
