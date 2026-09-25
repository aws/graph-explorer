import { LABELS } from "@/utils";

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

  it("should style by the specific label when the generic vertex label is present", () => {
    const vertex = createVertex({
      id: "1",
      types: ["vertex", "sqsqueue"],
    });

    expect(vertex.type).toBe("sqsqueue");
    expect(vertex.types).toStrictEqual(["vertex", "sqsqueue"]);
  });

  it("should ignore the generic vertex label regardless of case or position", () => {
    expect(createVertex({ id: "1", types: ["Vertex", "sqsqueue"] }).type).toBe(
      "sqsqueue",
    );
    expect(createVertex({ id: "1", types: ["VERTEX", "sqsqueue"] }).type).toBe(
      "sqsqueue",
    );
    expect(
      createVertex({ id: "1", types: ["vertex", "sqsqueue", "resource"] }).type,
    ).toBe("sqsqueue");
  });

  it("should keep the generic vertex label when it is the only label", () => {
    expect(createVertex({ id: "1", types: ["vertex"] }).type).toBe("vertex");
    expect(createVertex({ id: "1", types: ["Vertex"] }).type).toBe("Vertex");
  });

  it("should create a vertex with missing types", () => {
    const vertex = createVertex({
      id: "1",
      attributes: {
        name: "Alice",
      },
    });

    expect(vertex).toStrictEqual({
      id: "1",
      type: LABELS.MISSING_TYPE,
      types: [LABELS.MISSING_TYPE],
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
