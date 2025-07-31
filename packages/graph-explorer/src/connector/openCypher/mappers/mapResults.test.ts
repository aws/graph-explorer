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

    expect(result.vertices).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.scalars).toHaveLength(0);
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

    expect(result.vertices).toHaveLength(1);
    expect(result.vertices[0]).toEqual(vertex);
    expect(result.edges).toHaveLength(0);
    expect(result.scalars).toHaveLength(0);
  });

  it("should map edge value", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    const result = mapResults({
      results: [
        {
          n: createCypherEdge(edge),
        },
      ],
    });

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
    expect(result.vertices).toHaveLength(2);
    expect(result.scalars).toHaveLength(0);
  });

  it("should map scalar value", () => {
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

    expect(result.scalars).toHaveLength(4);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: expectedValue, name: "total" })
    );
    expect(result.scalars[1]).toEqual(
      createScalar({ value: "total", name: "name" })
    );
    expect(result.scalars[2]).toEqual(
      createScalar({ value: expectedValue, name: "list" })
    );
    expect(result.scalars[3]).toEqual(
      createScalar({ value: null, name: "nullValue" })
    );
    expect(result.vertices).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
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

    expect(result.vertices).toHaveLength(1);
    expect(result.vertices[0]).toEqual(vertex);
    expect(result.edges).toHaveLength(0);
    expect(result.scalars).toHaveLength(0);
  });

  it("should map edge in array", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const result = mapResults({
      results: [
        {
          n: [createCypherEdge(edge)],
        },
      ],
    });

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
    expect(result.vertices).toHaveLength(2);
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

    expect(result.scalars).toHaveLength(1);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: expectedValue, name: "n" })
    );
  });

  it("should map nested objects", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

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

    expect(result.vertices).toHaveLength(3);
    expect(result.vertices[0]).toEqual(vertex);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
  });

  it("should map deeply nested objects", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

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

    expect(result.vertices).toHaveLength(3);
    expect(result.vertices[0]).toEqual(vertex);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
  });

  it("should map nested objects within array", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

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

    expect(result.vertices).toHaveLength(3);
    expect(result.vertices[0]).toEqual(vertex);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
  });

  it("should map deeply nested objects within array", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

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

    expect(result.vertices).toHaveLength(3);
    expect(result.vertices[0]).toEqual(vertex);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      ...edge,
      __isFragment: true,
      sourceTypes: [],
      targetTypes: [],
    } satisfies Edge);
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

    expect(result.scalars).toHaveLength(1);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: expectedValue, name: "collect" })
    );
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

    expect(result.scalars).toHaveLength(1);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: expectedValue, name: "values" })
    );
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

    expect(result.scalars).toHaveLength(4);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: 42, name: "count" })
    );
    expect(result.scalars[1]).toEqual(
      createScalar({ value: "hello", name: "message" })
    );
    expect(result.scalars[2]).toEqual(
      createScalar({ value: true, name: "isActive" })
    );
    expect(result.scalars[3]).toEqual(
      createScalar({ value: null, name: "data" })
    );
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

    expect(result.scalars).toHaveLength(2);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: "John", name: "name" })
    );
    expect(result.scalars[1]).toEqual(createScalar({ value: 30, name: "age" }));
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

    expect(result.scalars).toHaveLength(5);
    expect(result.scalars[0]).toEqual(
      createScalar({ value: 1, name: "numbers" })
    );
    expect(result.scalars[1]).toEqual(
      createScalar({ value: 2, name: "numbers" })
    );
    expect(result.scalars[2]).toEqual(
      createScalar({ value: 3, name: "numbers" })
    );
    expect(result.scalars[3]).toEqual(
      createScalar({ value: "a", name: "strings" })
    );
    expect(result.scalars[4]).toEqual(
      createScalar({ value: "b", name: "strings" })
    );
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
