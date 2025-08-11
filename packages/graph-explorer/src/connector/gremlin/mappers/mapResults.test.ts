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
import { toMappedQueryResults } from "@/connector";

describe("mapResults", () => {
  it("should handle empty g:List", () => {
    const results = mapResults(createGList([]));
    expect(results).toEqual(toMappedQueryResults({}));
  });

  it("should handle empty g:Map", () => {
    const results = mapResults(createGMap({}));
    expect(results).toEqual(toMappedQueryResults({}));
  });

  it("should handle empty g:Set", () => {
    const results = mapResults({
      "@type": "g:Set",
      "@value": [],
    });
    expect(results).toEqual(toMappedQueryResults({}));
  });

  it("should handle g:List with g:Vertex", () => {
    const results = mapResults({
      "@type": "g:List",
      "@value": [
        {
          "@type": "g:Vertex",
          "@value": {
            id: "1",
            label: "Person",
            properties: {
              name: [
                {
                  "@type": "g:VertexProperty",
                  "@value": {
                    id: {
                      "@type": "g:Int32",
                      "@value": 1,
                    },
                    value: "Alice",
                    label: "name",
                  },
                },
              ],
            },
          },
        },
      ],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        vertices: [
          createVertex({
            id: "1",
            types: ["Person"],
            attributes: {
              name: "Alice",
            },
          }),
        ],
      })
    );
  });

  it("should remove duplicate vertices", () => {
    const vertex = createRandomVertex();
    const gVertex = createGVertex(vertex);
    const gList = createGList([gVertex, gVertex]);
    const results = mapResults(gList);
    expect(results).toEqual(
      toMappedQueryResults({
        vertices: [vertex],
      })
    );
  });

  it("should remove duplicate vertices", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const sourceFragment = createVertex({
      id: edge.source,
      types: [],
    });
    const targetFragment = createVertex({
      id: edge.target,
      types: [],
    });
    const gEdge = createGEdge(edge);
    const gList = createGList([gEdge, gEdge]);
    const results = mapResults(gList);
    expect(results).toEqual(
      toMappedQueryResults({
        edges: [edge],
        vertices: [sourceFragment, targetFragment],
      })
    );
  });

  it("should handle g:List with g:Edge", () => {
    const results = mapResults({
      "@type": "g:List",
      "@value": [
        {
          "@type": "g:Edge",
          "@value": {
            id: "3",
            label: "knows",
            inV: "1",
            outV: "2",
            properties: {
              since: {
                "@type": "g:Property",
                "@value": {
                  key: "since",
                  value: {
                    "@type": "g:Int32",
                    "@value": 20200101,
                  },
                },
              },
            },
          },
        },
      ],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        edges: [
          createEdge({
            id: "3",
            type: "knows",
            source: "2",
            target: "1",
            attributes: {
              since: 20200101,
            },
          }),
        ],
        vertices: [
          createVertex({ id: "2", types: [] }),
          createVertex({ id: "1", types: [] }),
        ],
      })
    );
  });

  it("should be fragment when no properties exist", () => {
    const vertex = createRandomVertex();
    vertex.__isFragment = true;
    vertex.attributes = {};
    const gVertex = createGVertex(vertex);
    const result = mapResults(gVertex);
    expect(result).toEqual(toMappedQueryResults({ vertices: [vertex] }));
  });

  it("should not be fragment when some properties exist", () => {
    const vertex = createRandomVertex();
    vertex.__isFragment = false;
    const gVertex = createGVertex(vertex);
    const result = mapResults(gVertex);
    expect(result).toEqual(toMappedQueryResults({ vertices: [vertex] }));
  });

  it("should handle g:List with null", () => {
    const results = mapResults(createGList([null]));
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [createScalar({ value: null })],
      })
    );
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
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [
          createScalar({ value: 42, name: "count" }),
          createScalar({ value: "John", name: "name" }),
          createScalar({ value: true, name: "active" }),
          createScalar({
            value: new Date("2020-01-01T00:00:00.000Z"),
            name: "time",
          }),
        ],
      })
    );
  });

  it("should handle g:Map with non-string keys", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": [createGInt32(1), "value1", createGType("ID"), "value2"],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [
          createScalar({ value: "value1", name: "1" }),
          createScalar({ value: "value2", name: "ID" }),
        ],
      })
    );
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
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [
          createScalar({ value: 100, name: "total" }),
          createScalar({ value: "success", name: "message" }),
        ],
      })
    );
  });

  it("should handle g:Map with null values", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": ["data", null, "count", createGInt32(5)],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [
          createScalar({ value: null, name: "data" }),
          createScalar({ value: 5, name: "count" }),
        ],
      })
    );
  });

  it("should handle g:Map with id and label values", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": [createGType("id"), "1", createGType("label"), "Foo::Bar"],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [
          createScalar({ value: "1", name: "id" }),
          createScalar({ value: "Foo::Bar", name: "label" }),
        ],
      })
    );
  });
});
