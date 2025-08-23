import { createVertex } from "./vertex";

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
});
