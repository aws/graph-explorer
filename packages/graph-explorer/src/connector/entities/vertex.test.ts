import { createVertex } from "@/core";
import { createResultVertex } from "./vertex";

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
      types: ["Person"],
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
