import {
  edgesAtom,
  explorerForTestingAtom,
  getAppStore,
  nodesAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createTestableEdge,
  createTestableVertex,
  FakeExplorer,
} from "@/utils/testing";

import { createResultScalar, getAllGraphableEntities } from "../entities";
import { executeUserQuery } from "./executeUserQuery";

describe("executeUserQuery", () => {
  it("should execute a query with empty results", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    rawQuerySpy.mockResolvedValue({ results: [], rawResponse: null });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(result.results).toStrictEqual([]);
    expect(result.rawResponse).toEqual(null);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should execute a query with vertex results", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createTestableVertex();
    const mockRawResponse = { test: "data" };
    rawQuerySpy.mockResolvedValue({
      results: [vertex.asResult()],
      rawResponse: mockRawResponse,
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(result.results).toStrictEqual([vertex.asPatchedResult()]);
    expect(result.rawResponse).toEqual(mockRawResponse);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should execute a query with vertex fragment results and fetch details", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createTestableVertex();
    explorer.addTestableVertex(vertex);
    const mockRawResponse = { test: "data" };
    rawQuerySpy.mockResolvedValue({
      results: [vertex.asFragmentResult()],
      rawResponse: mockRawResponse,
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(result.results).toStrictEqual([vertex.asPatchedResult()]);
    expect(result.rawResponse).toEqual(mockRawResponse);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should execute a query with edge result and fetch vertex details", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createTestableEdge();

    // Add the source and target vertices to the explorer so they can be found
    explorer.addTestableVertex(edge.source);
    explorer.addTestableVertex(edge.target);

    const mockRawResponse = { test: "data" };
    rawQuerySpy.mockResolvedValue({
      results: [edge.asResult()],
      rawResponse: mockRawResponse,
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(result.results).toStrictEqual([edge.asPatchedResult()]);
    expect(result.rawResponse).toEqual(mockRawResponse);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledWith(
      {
        vertexIds: [edge.source.id, edge.target.id],
      },
      expect.anything(),
    );
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should execute a query with edge fragment result and fetch details", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createTestableEdge();
    explorer.addTestableEdge(edge);

    const mockRawResponse = { test: "data" };
    rawQuerySpy.mockResolvedValue({
      results: [edge.asFragmentResult()],
      rawResponse: mockRawResponse,
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(result.results).toStrictEqual([edge.asPatchedResult()]);
    expect(result.rawResponse).toEqual(mockRawResponse);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should throw error if details are not found", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    vertexDetailsSpy.mockResolvedValue({ vertices: [] });
    edgeDetailsSpy.mockResolvedValue({ edges: [] });

    const edge = createTestableEdge();
    rawQuerySpy.mockResolvedValue({
      results: [edge.asFragmentResult()],
      rawResponse: null,
    });
    const mockUpdateSchema = vi.fn();

    const result = queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    await expect(result).rejects.toThrow("Failed to fetch edge details");
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).not.toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities([]),
    );
  });

  it("should execute a query and pass through scalars", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const edge = createTestableEdge();

    explorer.addTestableVertex(vertex1);
    explorer.addTestableVertex(vertex2);
    explorer.addTestableEdge(edge);

    const scalar1 = createResultScalar({ name: "scalar1", value: 42 });
    const scalar2 = createResultScalar({ name: "scalar2", value: "hello" });
    const queryResult = [
      vertex1.asFragmentResult(),
      vertex2.asFragmentResult(),
      edge.asResult(),
      scalar1,
      scalar2,
    ];
    const mockRawResponse = { test: "data" };
    rawQuerySpy.mockResolvedValue({
      results: queryResult,
      rawResponse: mockRawResponse,
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema),
    );

    expect(result.results).toStrictEqual([
      vertex1.asPatchedResult(),
      vertex2.asPatchedResult(),
      edge.asPatchedResult(),
      scalar1,
      scalar2,
    ]);
    expect(result.rawResponse).toEqual(mockRawResponse);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result.results),
    );
  });

  it("should update nodesAtom when vertices are already in graph", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const originalVertex = createTestableVertex();
    const updatedVertex = originalVertex.with({
      attributes: { name: "Updated Name" },
    });

    // Add original vertex to nodesAtom
    getAppStore().set(
      nodesAtom,
      new Map([[originalVertex.id, originalVertex.asVertex()]]),
    );

    // Mock explorer to return updated vertex
    explorer.addTestableVertex(updatedVertex);
    rawQuerySpy.mockResolvedValue({
      results: [updatedVertex.asResult()],
      rawResponse: null,
    });
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(executeUserQuery("query", mockUpdateSchema));

    // Verify nodesAtom was updated with the new vertex data
    const nodesMap = getAppStore().get(nodesAtom);
    expect(nodesMap.get(originalVertex.id)).toStrictEqual(
      updatedVertex.asVertex(),
    );
  });

  it("should update edgesAtom when edges are already in graph", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const originalEdge = createTestableEdge();
    const updatedEdge = originalEdge.with({
      attributes: { weight: 42 },
    });

    // Add original edge to edgesAtom
    getAppStore().set(
      edgesAtom,
      new Map([[originalEdge.id, originalEdge.asEdge()]]),
    );

    // Mock explorer to return updated edge
    explorer.addTestableEdge(updatedEdge);
    rawQuerySpy.mockResolvedValue({
      results: [updatedEdge.asResult()],
      rawResponse: null,
    });
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(executeUserQuery("query", mockUpdateSchema));

    // Verify edgesAtom was updated with the new edge data
    const edgesMap = getAppStore().get(edgesAtom);
    expect(edgesMap.get(originalEdge.id)).toStrictEqual(updatedEdge.asEdge());
  });

  it("should not update canvas state when entities are not in graph", async () => {
    const explorer = new FakeExplorer();
    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const vertex = createTestableVertex();
    const edge = createTestableEdge();

    explorer.addTestableVertex(vertex);
    explorer.addTestableEdge(edge);
    rawQuerySpy.mockResolvedValue({
      results: [vertex.asResult(), edge.asResult()],
      rawResponse: null,
    });
    const mockUpdateSchema = vi.fn();

    // Canvas state is empty
    expect(getAppStore().get(nodesAtom).size).toBe(0);
    expect(getAppStore().get(edgesAtom).size).toBe(0);

    await queryClient.fetchQuery(executeUserQuery("query", mockUpdateSchema));

    // Verify canvas state was not modified
    expect(getAppStore().get(nodesAtom).size).toBe(0);
    expect(getAppStore().get(edgesAtom).size).toBe(0);
  });
});
