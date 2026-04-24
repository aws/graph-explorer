import { emptyExplorer } from "./emptyExplorer";

const req = {} as any;

describe("emptyExplorer", () => {
  test("should return empty results for all methods", async () => {
    expect(await emptyExplorer.fetchSchema()).toStrictEqual({
      totalVertices: 0,
      vertices: [],
      totalEdges: 0,
      edges: [],
    });
    expect(await emptyExplorer.fetchVertexCountsByType(req)).toStrictEqual({
      total: 0,
    });
    expect(await emptyExplorer.fetchNeighbors(req)).toStrictEqual({
      vertices: [],
      edges: [],
    });
    expect(await emptyExplorer.neighborCounts(req)).toStrictEqual({
      counts: [],
    });
    expect(await emptyExplorer.keywordSearch(req)).toStrictEqual({
      vertices: [],
    });
    expect(await emptyExplorer.vertexDetails(req)).toStrictEqual({
      vertices: [],
    });
    expect(await emptyExplorer.edgeDetails(req)).toStrictEqual({ edges: [] });
    expect(await emptyExplorer.rawQuery(req)).toStrictEqual({
      results: [],
      rawResponse: null,
    });
    expect(await emptyExplorer.fetchEdgeConnections(req)).toStrictEqual({
      edgeConnections: [],
    });
  });
});
