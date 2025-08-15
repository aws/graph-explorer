import {
  createResultScalar,
  createResultBundle,
  ResultVertex,
  ResultEdge,
} from "@/core";
import { mapAnyValue, mapResults } from "./mapResults";
import {
  createGEdge,
  createGList,
  createGVertex,
  createRandomScalarValue,
  createTestableEdge,
  createTestableVertex,
} from "@/utils/testing";
import {
  createGBulkSet,
  createGDate,
  createGDouble,
  createGInt32,
  createGMap,
  createGPath,
  createGSet,
  createGType,
  createGValue,
} from "@/utils/testing/graphsonHelpers";
import {
  createArray,
  createRandomBoolean,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

describe("mapResults", () => {
  describe("common result sets", () => {
    it("should map vertices for vertexDetails query", () => {
      const vertices = createArray(3, () => createTestableVertex().asResult());
      const results = mapResults(createGList(vertices.map(createGVertex)));
      expect(results).toStrictEqual(vertices);
    });

    it("should map edges for edgeDetails query", () => {
      const edges = createArray(3, () => createTestableEdge().asResult());
      const results = mapResults(createGList(edges.map(createGEdge)));
      expect(results).toStrictEqual(edges);
    });
  });

  it("should ignore the root g:List", () => {
    const results = mapResults(createGList([createGValue(42)]));
    expect(results).toStrictEqual([createResultScalar({ value: 42 })]);
  });

  it("should promote the values of a bundle if there is only one and it has no name", () => {
    const vertex = createTestableVertex().asResult("vertex");
    const results = mapResults(
      createGList([createGMap({ vertex: createGVertex(vertex) })])
    );
    expect(results).toStrictEqual([vertex]);
  });
});

describe("mapAnyValue", () => {
  describe("given basic values", () => {
    it("should map string to scalar", () => {
      const name = createRandomName("name");
      const value = createRandomName("value");
      expect(mapAnyValue(createGValue(value))).toStrictEqual([
        createResultScalar({ value }),
      ]);
      expect(mapAnyValue(createGValue(value), name)).toStrictEqual([
        createResultScalar({ value, name }),
      ]);
    });

    it("should map boolean to scalar", () => {
      const value = createRandomBoolean();
      const results = mapAnyValue(createGValue(value));
      expect(results).toStrictEqual([createResultScalar({ value })]);
    });

    it("should map g:Int32 to scalar", () => {
      const value = createRandomInteger();
      const results = mapAnyValue(createGInt32(value));
      expect(results).toStrictEqual([createResultScalar({ value })]);
    });

    it("should map g:Double to scalar", () => {
      const value = createRandomDouble();
      const results = mapAnyValue(createGDouble(value));
      expect(results).toStrictEqual([createResultScalar({ value })]);
    });

    it("should map g:Date to scalar", () => {
      const value = new Date();
      const results = mapAnyValue(createGDate(value));
      expect(results).toStrictEqual([createResultScalar({ value })]);
    });

    it("should map g:Type to scalar", () => {
      const value = "Person";
      const results = mapAnyValue(createGType(value));
      expect(results).toStrictEqual([createResultScalar({ value })]);
    });

    it("should map g:Vertex to vertex", () => {
      const vertex = createTestableVertex().asResult();
      const results = mapAnyValue(createGVertex(vertex));
      expect(results).toStrictEqual([vertex]);
    });

    it("should map g:Edge to edge", () => {
      const edge = createTestableEdge().asResult();
      const results = mapAnyValue(createGEdge(edge));
      expect(results).toStrictEqual([edge]);
    });

    it("should map g:Vertex without properties to a fragment", () => {
      const vertex = createTestableVertex().asFragmentResult();
      const results = mapAnyValue(createGVertex(vertex));
      expect(results).toStrictEqual([vertex]);
      expect((results[0] as ResultVertex).attributes).toBeUndefined();
    });

    it("should map g:Edge without properties to a fragment", () => {
      const edge = createTestableEdge().asFragmentResult();
      const results = mapAnyValue(createGEdge(edge));
      expect(results).toStrictEqual([edge]);
      expect((results[0] as ResultEdge).attributes).toBeUndefined();
    });

    it("should map g:Vertex with empty properties", () => {
      const vertex = createTestableVertex().asResult();
      vertex.attributes = {};
      const results = mapAnyValue(createGVertex(vertex));
      expect(results).toStrictEqual([vertex]);
      expect((results[0] as ResultVertex).attributes).not.toBeUndefined();
    });

    it("should map g:Edge with empty properties", () => {
      const edge = createTestableEdge().asResult();
      edge.attributes = {};
      const results = mapAnyValue(createGEdge(edge));
      expect(results).toStrictEqual([edge]);
      expect((results[0] as ResultEdge).attributes).not.toBeUndefined();
    });
  });

  describe("given g:List", () => {
    it("should map empty to an empty bundle", () => {
      const results = mapAnyValue(createGList([]));
      expect(results).toStrictEqual([]);
    });

    it("should map single item without bundle", () => {
      const vertex = createTestableVertex().asResult();
      const results = mapAnyValue(createGList([createGVertex(vertex)]));
      expect(results).toStrictEqual([vertex]);
    });

    it("should map items in to bundle", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();
      const scalar = createResultScalar({ value: createRandomScalarValue() });
      const results = mapAnyValue(
        createGList([
          createGVertex(vertex),
          createGEdge(edge),
          createGValue(scalar.value),
          null,
        ])
      );
      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalar, createResultScalar({ value: null })],
        }),
      ]);
    });

    it("should map items in to bundle and keep duplicate values", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();
      const scalar = createResultScalar({ value: createRandomScalarValue() });
      const results = mapAnyValue(
        createGList([
          createGVertex(vertex),
          createGEdge(edge),
          createGValue(scalar.value),
          createGVertex(vertex),
          createGEdge(edge),
          createGValue(scalar.value),
        ])
      );
      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalar, vertex, edge, scalar],
        }),
      ]);
    });
  });

  describe("given g:Set", () => {
    it("should ignore empty g:Set", () => {
      const results = mapAnyValue(createGSet([]));
      expect(results).toStrictEqual([]);
    });

    it("should map items in to bundle", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();
      const scalar = createResultScalar({ value: createRandomScalarValue() });
      const results = mapAnyValue(
        createGSet([
          createGVertex(vertex),
          createGEdge(edge),
          createGValue(scalar.value),
          null,
        ])
      );
      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalar, createResultScalar({ value: null })],
        }),
      ]);
    });
  });

  describe("given g:Map", () => {
    it("should ignore empty g:Map", () => {
      const results = mapAnyValue(createGMap({}));
      expect(results).toStrictEqual([]);
    });

    it("should map g:Map keys and values", () => {
      const vertex = createTestableVertex().asResult("vertex");
      const edge = createTestableEdge().asResult("edge");
      const scalarString = createResultScalar({
        name: "string",
        value: createRandomName(),
      });
      const scalarNull = createResultScalar({ name: "null", value: null });
      const results = mapAnyValue(
        createGMap({
          vertex: createGVertex(vertex),
          edge: createGEdge(edge),
          string: createGValue(scalarString.value),
          null: createGValue(scalarNull.value),
        })
      );

      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalarString, scalarNull],
        }),
      ]);
    });

    it("should handle g:Map with non-string keys", () => {
      const results = mapAnyValue({
        "@type": "g:Map",
        "@value": [createGInt32(1), "value1", createGType("ID"), "value2"],
      });
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: "value1", name: "1" }),
            createResultScalar({ value: "value2", name: "ID" }),
          ],
        }),
      ]);
    });

    it("should handle g:Map with id and label values", () => {
      const results = mapAnyValue({
        "@type": "g:Map",
        "@value": [createGType("id"), "1", createGType("label"), "Foo::Bar"],
      });
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: "1", name: "id" }),
            createResultScalar({ value: "Foo::Bar", name: "label" }),
          ],
        }),
      ]);
    });

    it("should map", () => {
      const results = mapAnyValue(
        createGMap({
          city: createGList(["Atlanta"]),
          code: createGList(["ATL"]),
        })
      );
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: "Atlanta", name: "city" }),
            createResultScalar({ value: "ATL", name: "code" }),
          ],
        }),
      ]);
    });
  });

  describe("given g:BulkSet", () => {
    it("should ignore empty g:BulkSet", () => {
      const results = mapAnyValue(createGBulkSet({}));
      expect(results).toStrictEqual([]);
    });

    it("should map g:BulkSet keys and values", () => {
      const vertex = createTestableVertex().asResult("vertex");
      const edge = createTestableEdge().asResult("edge");
      const scalarString = createResultScalar({
        name: "string",
        value: createRandomName(),
      });
      const scalarNull = createResultScalar({ name: "null", value: null });
      const results = mapAnyValue(
        createGBulkSet({
          vertex: createGVertex(vertex),
          edge: createGEdge(edge),
          string: createGValue(scalarString.value),
          null: createGValue(scalarNull.value),
        })
      );

      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalarString, scalarNull],
        }),
      ]);
    });

    it("should handle g:BulkSet with non-string keys", () => {
      const results = mapAnyValue({
        "@type": "g:BulkSet",
        "@value": [createGInt32(1), "value1", createGType("ID"), "value2"],
      });
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: "value1", name: "1" }),
            createResultScalar({ value: "value2", name: "ID" }),
          ],
        }),
      ]);
    });

    it("should handle g:BulkSet with id and label values", () => {
      const results = mapAnyValue({
        "@type": "g:BulkSet",
        "@value": [createGType("id"), "1", createGType("label"), "Foo::Bar"],
      });
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: "1", name: "id" }),
            createResultScalar({ value: "Foo::Bar", name: "label" }),
          ],
        }),
      ]);
    });
  });

  describe("given g:Path", () => {
    it("should map empty to an empty bundle", () => {
      const results = mapAnyValue(createGPath([]));
      expect(results).toStrictEqual([createResultBundle({ values: [] })]);
    });

    it("should map items in to bundle", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();
      const scalar = createResultScalar({ value: createRandomScalarValue() });
      const results = mapAnyValue(createGPath([vertex, edge, scalar]));
      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalar],
        }),
      ]);
    });

    it("should map items with names in to bundle", () => {
      const vertex = createTestableVertex().asResult("vertex");
      const edge = createTestableEdge().asResult("edge");
      const scalar = createResultScalar({
        name: "scalar",
        value: createRandomScalarValue(),
      });
      const results = mapAnyValue(createGPath([vertex, edge, scalar]));
      expect(results).toStrictEqual([
        createResultBundle({
          values: [vertex, edge, scalar],
        }),
      ]);
    });
  });

  describe("given nested values", () => {
    it("should handle nested g:Map in g:List", () => {
      const results = mapAnyValue(
        createGList([
          createGMap({
            total: createGInt32(100),
            message: "success",
          }),
        ])
      );
      expect(results).toStrictEqual([
        createResultBundle({
          values: [
            createResultScalar({ value: 100, name: "total" }),
            createResultScalar({ value: "success", name: "message" }),
          ],
        }),
      ]);
    });

    it("should create bundle for nested g:Map", () => {
      const results = mapAnyValue(
        createGMap({
          user: createGMap({
            name: "John",
            age: createGInt32(30),
          }),
        })
      );
      expect(results).toStrictEqual([
        createResultBundle({
          name: "user",
          values: [
            createResultScalar({ value: "John", name: "name" }),
            createResultScalar({ value: 30, name: "age" }),
          ],
        }),
      ]);
    });

    it("should create bundle for nested g:List", () => {
      const results = mapAnyValue(
        createGMap({
          numbers: createGList([
            createGInt32(1),
            createGInt32(2),
            createGInt32(3),
          ]),
        })
      );
      expect(results).toStrictEqual([
        createResultBundle({
          name: "numbers",
          values: [
            createResultScalar({ value: 1 }),
            createResultScalar({ value: 2 }),
            createResultScalar({ value: 3 }),
          ],
        }),
      ]);
    });

    it("should create bundle for nested g:Set", () => {
      const results = mapAnyValue(
        createGMap({
          tags: createGSet(["tag1", "tag2"]),
        })
      );
      expect(results).toStrictEqual([
        createResultBundle({
          name: "tags",
          values: [
            createResultScalar({ value: "tag1" }),
            createResultScalar({ value: "tag2" }),
          ],
        }),
      ]);
    });

    it("should handle deeply nested structures with bundles", () => {
      const results = mapAnyValue(
        createGMap({
          data: createGMap({
            users: createGList([
              createGMap({
                name: "Alice",
                details: createGMap({
                  age: createGInt32(25),
                  active: true,
                }),
              }),
            ]),
          }),
        })
      );
      expect(results).toStrictEqual([
        createResultBundle({
          name: "data",
          values: [
            createResultBundle({
              name: "users",
              values: [
                createResultScalar({ value: "Alice", name: "name" }),
                createResultBundle({
                  name: "details",
                  values: [
                    createResultScalar({ value: 25, name: "age" }),
                    createResultScalar({
                      value: true,
                      name: "active",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ]);
    });
  });
});
