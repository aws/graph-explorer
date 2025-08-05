import { createEdge, createScalar, createVertex } from "@/core";
import { mapResults } from "./mapResults";
import {
  createGEdge,
  createGList,
  createGVertex,
  createRandomEdge,
  createRandomVertex,
} from "@/utils/testing";
import {
  createGDate,
  createGInt32,
  createGMap,
  createGType,
} from "@/utils/testing/graphsonHelpers";

describe("mapResults", () => {
  it("should handle empty g:List", () => {
    const results = mapResults(createGList([]));
    expect(results).toEqual([]);
  });

  it("should handle empty g:Map", () => {
    const results = mapResults(createGMap({}));
    expect(results).toEqual([]);
  });

  it("should handle empty g:Set", () => {
    const results = mapResults({
      "@type": "g:Set",
      "@value": [],
    });
    expect(results).toEqual([]);
  });

  it("should handle g:List with g:Vertex", () => {
    const vertex = createVertex({
      id: "1",
      types: ["Person"],
      attributes: {
        name: "Alice",
      },
    });
    const results = mapResults(createGList([createGVertex(vertex)]));
    expect(results).toEqual([vertex]);
  });

  it("should not remove duplicate vertices", () => {
    const vertex = createRandomVertex();
    const gVertex = createGVertex(vertex);
    const gList = createGList([gVertex, gVertex]);
    const results = mapResults(gList);
    expect(results).toEqual([vertex, vertex]);
  });

  it("should not remove duplicate edges", () => {
    const source = createRandomVertex();
    const target = createRandomVertex();
    const edge = createRandomEdge(source, target);

    const gEdge = createGEdge(edge);
    const gList = createGList([gEdge, gEdge]);

    const results = mapResults(gList);

    expect(results).toEqual([edge, edge]);
  });

  it("should handle g:List with g:Edge", () => {
    const edge = createEdge({
      id: "3",
      type: "knows",
      source: {
        id: "2",
        types: ["Person"],
      },
      target: {
        id: "1",
        types: ["Person"],
      },
      attributes: {
        since: 20200101,
      },
    });
    const results = mapResults(createGList([createGEdge(edge)]));
    expect(results).toEqual([edge]);
  });

  it("should be fragment when no properties exist", () => {
    const vertex = createRandomVertex();
    vertex.__isFragment = true;
    vertex.attributes = {};
    const gVertex = createGVertex(vertex);
    const result = mapResults(gVertex);
    expect(result).toEqual([vertex]);
  });

  it("should not be fragment when some properties exist", () => {
    const vertex = createRandomVertex();
    vertex.__isFragment = false;
    const gVertex = createGVertex(vertex);
    const result = mapResults(gVertex);
    expect(result).toEqual([vertex]);
  });

  it("should handle g:List with null", () => {
    const results = mapResults(createGList([null]));
    expect(results).toEqual([createScalar({ value: null })]);
  });

  it("should add names to scalars from g:Map keys", () => {
    const results = mapResults(
      createGMap({
        count: createGInt32(42),
        name: "John",
        active: true,
        time: createGDate(new Date("2020-01-01T00:00:00.000Z")),
      })
    );
    expect(results).toEqual([
      createScalar({ value: 42, name: "count" }),
      createScalar({ value: "John", name: "name" }),
      createScalar({ value: true, name: "active" }),
      createScalar({
        value: new Date("2020-01-01T00:00:00.000Z"),
        name: "time",
      }),
    ]);
  });

  it("should handle g:Map with non-string keys", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": [createGInt32(1), "value1", createGType("ID"), "value2"],
    });
    expect(results).toEqual([
      createScalar({ value: "value1", name: "1" }),
      createScalar({ value: "value2", name: "ID" }),
    ]);
  });

  it("should handle nested g:Map in g:List", () => {
    const results = mapResults(
      createGList([
        createGMap({
          total: createGInt32(100),
          message: "success",
        }),
      ])
    );
    expect(results).toEqual([
      createScalar({ value: 100, name: "total" }),
      createScalar({ value: "success", name: "message" }),
    ]);
  });

  it("should handle g:Map with null values", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": ["data", null, "count", createGInt32(5)],
    });
    expect(results).toEqual([
      createScalar({ value: null, name: "data" }),
      createScalar({ value: 5, name: "count" }),
    ]);
  });

  it("should handle g:Map with id and label values", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": [createGType("id"), "1", createGType("label"), "Foo::Bar"],
    });
    expect(results).toEqual([
      createScalar({ value: "1", name: "id" }),
      createScalar({ value: "Foo::Bar", name: "label" }),
    ]);
  });
});
