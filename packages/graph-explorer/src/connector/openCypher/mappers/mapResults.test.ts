import { createResultBundle, createResultScalar } from "@/connector/entities";
import { mapResults } from "./mapResults";
import {
  createTestableEdge,
  createTestableVertex,
  mapToOcEdge,
  mapToOcScalar,
  mapToOcVertex,
} from "@/utils/testing";
import {
  createArray,
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";

describe("mapResults", () => {
  it("should map empty results", () => {
    const result = mapResults({
      results: [],
    });

    expect(result).toStrictEqual([]);
  });

  it("should map solo vertex value without bundle", () => {
    const vertex = createTestableVertex().asResult("n");
    const result = mapResults({
      results: [
        {
          n: mapToOcVertex(vertex),
        },
      ],
    });

    expect(result).toStrictEqual([vertex]);
  });

  it("should map multiple vertices to bundle", () => {
    const vertex1 = createTestableVertex().asResult("first");
    const vertex2 = createTestableVertex().asResult("second");
    const result = mapResults({
      results: [
        {
          first: mapToOcVertex(vertex1),
          second: mapToOcVertex(vertex2),
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        values: [vertex1, vertex2],
      }),
    ]);
  });

  it("should map solo edge value without bundle", () => {
    const edge = createTestableEdge().asResult("n");

    const result = mapResults({
      results: [
        {
          n: mapToOcEdge(edge),
        },
      ],
    });

    expect(result).toStrictEqual([edge]);
  });

  it("should map multiple edges to bundle", () => {
    const edge1 = createTestableEdge().asResult("first");
    const edge2 = createTestableEdge().asResult("second");
    const result = mapResults({
      results: [
        {
          first: mapToOcEdge(edge1),
          second: mapToOcEdge(edge2),
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        values: [edge1, edge2],
      }),
    ]);
  });

  it("should map scalar value with names to bundle", () => {
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

    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultScalar({ value: expectedValue, name: "total" }),
          createResultScalar({ value: "total", name: "name" }),
          createResultBundle({
            name: "list",
            values: [createResultScalar({ value: expectedValue })],
          }),
          createResultScalar({ value: null, name: "nullValue" }),
        ],
      }),
    ]);
  });

  it("should map vertex in array to bundle", () => {
    const vertices = createArray(3, () => createTestableVertex().asResult());
    const result = mapResults({
      results: [
        {
          n: vertices.map(mapToOcVertex),
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: vertices,
      }),
    ]);
  });

  it("should map edge in array to bundle", () => {
    const edges = createArray(3, () => createTestableEdge().asResult());

    const result = mapResults({
      results: [
        {
          n: edges.map(mapToOcEdge),
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: edges,
      }),
    ]);
  });

  it("should map scalars in array to bundle", () => {
    const scalars = [
      createResultScalar({ value: createRandomBoolean() }),
      createResultScalar({ value: createRandomInteger() }),
      createResultScalar({ value: createRandomDouble() }),
      createResultScalar({ value: createRandomUrlString() }),
      createResultScalar({ value: createRandomName() }),
      createResultScalar({ value: null }),
    ];

    const result = mapResults({
      results: [
        {
          n: scalars.map(s => mapToOcScalar(s.value)),
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: scalars,
      }),
    ]);
  });

  it("should map nested objects to bundle", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

    const result = mapResults({
      results: [
        {
          n: {
            v: mapToOcVertex(vertex),
            e: mapToOcEdge(edge),
          },
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: [vertex, edge],
      }),
    ]);
  });

  it("should map deeply nested objects to nested bundles", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

    const result = mapResults({
      results: [
        {
          n: {
            deep: {
              v: mapToOcVertex(vertex),
              e: mapToOcEdge(edge),
            },
          },
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: [
          createResultBundle({
            name: "deep",
            values: [vertex, edge],
          }),
        ],
      }),
    ]);
  });

  it("should map nested objects within array to bundles", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

    const result = mapResults({
      results: [
        {
          n: [
            {
              v: mapToOcVertex(vertex),
              e: mapToOcEdge(edge),
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "n",
        values: [
          createResultBundle({
            values: [vertex, edge],
          }),
        ],
      }),
    ]);
  });

  it("should map deeply nested objects within array", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

    const result = mapResults({
      results: [
        {
          outer: [
            {
              inner: {
                v: mapToOcVertex(vertex),
                e: mapToOcEdge(edge),
              },
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual([
      createResultBundle({
        name: "outer",
        values: [
          createResultBundle({
            values: [
              createResultBundle({
                name: "inner",
                values: [vertex, edge],
              }),
            ],
          }),
        ],
      }),
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

    expect(result).toStrictEqual([
      createResultBundle({
        name: "collect",
        values: [createResultScalar({ value: expectedValue })],
      }),
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

    expect(result).toStrictEqual([
      createResultBundle({
        name: "collect",
        values: [
          createResultBundle({
            values: [
              createResultScalar({ value: expectedValue, name: "values" }),
            ],
          }),
        ],
      }),
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

    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultScalar({ value: 42, name: "count" }),
          createResultScalar({ value: "hello", name: "message" }),
          createResultScalar({ value: true, name: "isActive" }),
          createResultScalar({ value: null, name: "data" }),
        ],
      }),
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

    expect(result).toStrictEqual([
      createResultBundle({
        name: "user",
        values: [
          createResultScalar({ value: "John", name: "name" }),
          createResultScalar({ value: 30, name: "age" }),
        ],
      }),
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

    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultBundle({
            name: "numbers",
            values: [
              createResultScalar({ value: 1 }),
              createResultScalar({ value: 2 }),
              createResultScalar({ value: 3 }),
            ],
          }),
          createResultBundle({
            name: "strings",
            values: [
              createResultScalar({ value: "a" }),
              createResultScalar({ value: "b" }),
            ],
          }),
        ],
      }),
    ]);
  });

  it("should create bundles for multiple result objects with vertices and edges", () => {
    const vertex1 = createTestableVertex().asResult("n");
    const edge1 = createTestableEdge().asResult("e");
    const vertex2 = createTestableVertex().asResult("tgt");

    const vertex3 = createTestableVertex().asResult("n");
    const edge2 = createTestableEdge().asResult("e");
    const vertex4 = createTestableVertex().asResult("tgt");

    const result = mapResults({
      results: [
        {
          n: mapToOcVertex(vertex1),
          e: mapToOcEdge(edge1),
          tgt: mapToOcVertex(vertex2),
        },
        {
          n: mapToOcVertex(vertex3),
          e: mapToOcEdge(edge2),
          tgt: mapToOcVertex(vertex4),
        },
      ],
    });

    // Should create two bundles at the root level, each containing 3 entities
    expect(result).toHaveLength(2);
    expect(result).toStrictEqual([
      createResultBundle({
        values: [vertex1, edge1, vertex2],
      }),
      createResultBundle({
        values: [vertex3, edge2, vertex4],
      }),
    ]);
  });

  it("should create bundles for multiple result objects with scalars", () => {
    const result = mapResults({
      results: [
        {
          "n.code": "ATL",
          "n.desc": "Hartsfield - Jackson Atlanta International Airport",
        },
        {
          "n.code": "ANC",
          "n.desc": "Anchorage Ted Stevens",
        },
      ],
    });

    // Should create two bundles at the root level, each containing 2 scalars
    expect(result).toHaveLength(2);
    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultScalar({ value: "ATL", name: "n.code" }),
          createResultScalar({
            value: "Hartsfield - Jackson Atlanta International Airport",
            name: "n.desc",
          }),
        ],
      }),
      createResultBundle({
        values: [
          createResultScalar({ value: "ANC", name: "n.code" }),
          createResultScalar({
            value: "Anchorage Ted Stevens",
            name: "n.desc",
          }),
        ],
      }),
    ]);
  });
});
