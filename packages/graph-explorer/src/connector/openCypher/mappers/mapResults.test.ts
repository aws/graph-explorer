import { createScalar, Edge, getRawId, Vertex } from "@/core";
import { mapResults } from "./mapResults";
import { createRandomEdge, createRandomVertex } from "@/utils/testing";
import { createRandomInteger } from "@shared/utils/testing";
import { OCEdge, OCVertex } from "../types";

describe("mapResults", () => {
  it("should map empty results", () => {
    const result = mapResults({
      results: [],
    });

    expect(result).toEqual([]);
  });

  it("should map vertex value", () => {
    const vertex = createRandomVertex();
    const result = mapResults({
      results: [
        {
          n: createCypherVertex(vertex),
        },
      ],
    });

    expect(result).toEqual([vertex]);
  });

  it("should map edge value", () => {
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);
    edge.sourceTypes = [];
    edge.targetTypes = [];

    const result = mapResults({
      results: [
        {
          n: createCypherEdge(edge),
        },
      ],
    });

    expect(result).toEqual([{ ...edge, __isFragment: true }]);
  });

  it("should map scalar value with names", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          total: expectedValue,
          name: "total",
          list: [expectedValue],
          nullValue: null,
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: expectedValue, name: "total" }),
      createScalar({ value: "total", name: "name" }),
      createScalar({ value: expectedValue, name: "list" }),
      createScalar({ value: null, name: "nullValue" }),
    ]);
  });

  it("should map vertex in array", () => {
    const vertex = createRandomVertex();
    const result = mapResults({
      results: [
        {
          n: [createCypherVertex(vertex)],
        },
      ],
    });

    expect(result).toEqual([vertex]);
  });

  it("should map edge in array", () => {
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);
    edge.sourceTypes = [];
    edge.targetTypes = [];

    const result = mapResults({
      results: [
        {
          n: [createCypherEdge(edge)],
        },
      ],
    });

    expect(result).toEqual([{ ...edge, __isFragment: true }]);
  });

  it("should map scalar in array", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          n: [expectedValue],
        },
      ],
    });

    expect(result).toEqual([createScalar({ value: expectedValue, name: "n" })]);
  });

  it("should map nested objects", () => {
    const vertex = createRandomVertex();
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);

    const result = mapResults({
      results: [
        {
          n: {
            v: createCypherVertex(vertex),
            e: createCypherEdge(edge),
          },
        },
      ],
    });

    expect(result).toEqual([
      vertex,
      {
        ...edge,
        __isFragment: true,
        sourceTypes: [],
        targetTypes: [],
      } satisfies Edge,
    ]);
  });

  it("should map deeply nested objects", () => {
    const vertex = createRandomVertex();
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);

    const result = mapResults({
      results: [
        {
          n: {
            deep: {
              v: createCypherVertex(vertex),
              e: createCypherEdge(edge),
            },
          },
        },
      ],
    });

    expect(result).toEqual([
      vertex,
      {
        ...edge,
        __isFragment: true,
        sourceTypes: [],
        targetTypes: [],
      } satisfies Edge,
    ]);
  });

  it("should map nested objects within array", () => {
    const vertex = createRandomVertex();
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);

    const result = mapResults({
      results: [
        {
          n: [
            {
              v: createCypherVertex(vertex),
              e: createCypherEdge(edge),
            },
          ],
        },
      ],
    });

    expect(result).toEqual([
      vertex,
      {
        ...edge,
        __isFragment: true,
        sourceTypes: [],
        targetTypes: [],
      } satisfies Edge,
    ]);
  });

  it("should map deeply nested objects within array", () => {
    const vertex = createRandomVertex();
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);

    const result = mapResults({
      results: [
        {
          n: [
            {
              deep: {
                v: createCypherVertex(vertex),
                e: createCypherEdge(edge),
              },
            },
          ],
        },
      ],
    });

    expect(result).toEqual([
      vertex,
      {
        ...edge,
        __isFragment: true,
        sourceTypes: [],
        targetTypes: [],
      } satisfies Edge,
    ]);
  });

  it("should map collect with array of scalars", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          collect: [expectedValue],
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: expectedValue, name: "collect" }),
    ]);
  });

  it("should map collect with array of records", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          collect: [{ values: expectedValue }],
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: expectedValue, name: "values" }),
    ]);
  });

  it("should preserve scalar names from top-level keys", () => {
    const result = mapResults({
      results: [
        {
          count: 42,
          message: "hello",
          isActive: true,
          data: null,
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: 42, name: "count" }),
      createScalar({ value: "hello", name: "message" }),
      createScalar({ value: true, name: "isActive" }),
      createScalar({ value: null, name: "data" }),
    ]);
  });

  it("should preserve names for scalars in nested objects", () => {
    const result = mapResults({
      results: [
        {
          user: {
            name: "John",
            age: 30,
          },
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: "John", name: "name" }),
      createScalar({ value: 30, name: "age" }),
    ]);
  });

  it("should preserve names for scalars in arrays", () => {
    const result = mapResults({
      results: [
        {
          numbers: [1, 2, 3],
          strings: ["a", "b"],
        },
      ],
    });

    expect(result).toEqual([
      createScalar({ value: 1, name: "numbers" }),
      createScalar({ value: 2, name: "numbers" }),
      createScalar({ value: 3, name: "numbers" }),
      createScalar({ value: "a", name: "strings" }),
      createScalar({ value: "b", name: "strings" }),
    ]);
  });
});

function createCypherVertex(vertex: Vertex): OCVertex {
  const id = getRawId(vertex.id);

  if (typeof id !== "string") {
    throw new Error("Vertex id is not valid");
  }

  return {
    "~id": id,
    "~entityType": "node",
    "~labels": vertex.types,
    "~properties": vertex.attributes,
  };
}

function createCypherEdge(edge: Edge): OCEdge {
  const id = getRawId(edge.id);
  const sourceId = getRawId(edge.source);
  const targetId = getRawId(edge.target);

  if (typeof id !== "string") {
    throw new Error("Edge id is not valid");
  }
  if (typeof sourceId !== "string") {
    throw new Error("Edge source is not valid");
  }
  if (typeof targetId !== "string") {
    throw new Error("Edge target is not valid");
  }

  return {
    "~id": id,
    "~entityType": "relationship",
    "~type": edge.type,
    "~start": sourceId,
    "~end": targetId,
    "~properties": edge.attributes,
  };
}
