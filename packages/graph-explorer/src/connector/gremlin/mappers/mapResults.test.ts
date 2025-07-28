import { createEdge, createScalar, createVertex } from "@/core";
import { mapResults } from "./mapResults";
import {
  createGEdge,
  createGList,
  createGVertex,
  createRandomEdge,
  createRandomVertex,
} from "@/utils/testing";
import { toMappedQueryResults } from "@/connector";

describe("mapResults", () => {
  it("should handle empty g:List", () => {
    const results = mapResults({
      "@type": "g:List",
      "@value": [],
    });
    expect(results).toEqual(toMappedQueryResults({}));
  });

  it("should handle empty g:Map", () => {
    const results = mapResults({
      "@type": "g:Map",
      "@value": [],
    });
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
      types: edge.sourceTypes,
    });
    const targetFragment = createVertex({
      id: edge.target,
      types: edge.targetTypes,
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
            inVLabel: "Person",
            outVLabel: "Person",
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
          }),
        ],
        vertices: [
          createVertex({ id: "2", types: ["Person"] }),
          createVertex({ id: "1", types: ["Person"] }),
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
    const results = mapResults({
      "@type": "g:List",
      "@value": [null],
    });
    expect(results).toEqual(
      toMappedQueryResults({
        scalars: [createScalar(null)],
      })
    );
  });
});
