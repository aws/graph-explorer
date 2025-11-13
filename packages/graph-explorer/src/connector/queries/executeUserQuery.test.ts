import { createQueryClient } from "@/core/queryClient";
import {
  createTestableEdge,
  createTestableVertex,
  FakeExplorer,
} from "@/utils/testing";
import { executeUserQuery } from "./executeUserQuery";
import { getAllGraphableEntities, createResultScalar } from "../entities";
import { edgesAtom, getAppStore, nodesAtom } from "@/core";

describe("executeUserQuery", () => {
  it("should execute a query with empty results", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    rawQuerySpy.mockResolvedValue([]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toStrictEqual([]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query with vertex results", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createTestableVertex();
    rawQuerySpy.mockResolvedValue([vertex.asResult()]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toStrictEqual([vertex.asPatchedResult()]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query with vertex fragment results and fetch details", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createTestableVertex();
    explorer.addTestableVertex(vertex);
    rawQuerySpy.mockResolvedValue([vertex.asFragmentResult()]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toStrictEqual([vertex.asPatchedResult()]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query with edge result and fetch vertex details", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createTestableEdge();

    // Add the source and target vertices to the explorer so they can be found
    explorer.addTestableVertex(edge.source);
    explorer.addTestableVertex(edge.target);

    rawQuerySpy.mockResolvedValue([edge.asResult()]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toStrictEqual([edge.asPatchedResult()]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledWith(
      {
        vertexIds: [edge.source.id, edge.target.id],
      },
      expect.anything()
    );
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query with edge fragment result and fetch details", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createTestableEdge();
    explorer.addTestableEdge(edge);

    rawQuerySpy.mockResolvedValue([edge.asFragmentResult()]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(result).toStrictEqual([edge.asPatchedResult()]);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should throw error if details are not found", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    vertexDetailsSpy.mockResolvedValue({ vertices: [] });
    edgeDetailsSpy.mockResolvedValue({ edges: [] });

    const edge = createTestableEdge();
    rawQuerySpy.mockResolvedValue([edge.asFragmentResult()]);
    const mockUpdateSchema = vi.fn();

    const result = queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    await expect(result).rejects.toThrow("Failed to fetch edge details");
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).not.toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities([])
    );
  });

  it("should execute a query and pass through scalars", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

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
    rawQuerySpy.mockResolvedValue(queryResult);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toStrictEqual([
      vertex1.asPatchedResult(),
      vertex2.asPatchedResult(),
      edge.asPatchedResult(),
      scalar1,
      scalar2,
    ]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should update nodesAtom when vertices are already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const originalVertex = createTestableVertex();
    const updatedVertex = originalVertex.with({
      attributes: { name: "Updated Name" },
    });

    // Add original vertex to nodesAtom
    getAppStore().set(
      nodesAtom,
      new Map([[originalVertex.id, originalVertex.asVertex()]])
    );

    // Mock explorer to return updated vertex
    explorer.addTestableVertex(updatedVertex);
    rawQuerySpy.mockResolvedValue([updatedVertex.asResult()]);
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(executeUserQuery("query", mockUpdateSchema));

    // Verify nodesAtom was updated with the new vertex data
    const nodesMap = getAppStore().get(nodesAtom);
    expect(nodesMap.get(originalVertex.id)).toStrictEqual(
      updatedVertex.asVertex()
    );
  });

  it("should update edgesAtom when edges are already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const originalEdge = createTestableEdge();
    const updatedEdge = originalEdge.with({
      attributes: { weight: 42 },
    });

    // Add original edge to edgesAtom
    getAppStore().set(
      edgesAtom,
      new Map([[originalEdge.id, originalEdge.asEdge()]])
    );

    // Mock explorer to return updated edge
    explorer.addTestableEdge(updatedEdge);
    rawQuerySpy.mockResolvedValue([updatedEdge.asResult()]);
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(executeUserQuery("query", mockUpdateSchema));

    // Verify edgesAtom was updated with the new edge data
    const edgesMap = getAppStore().get(edgesAtom);
    expect(edgesMap.get(originalEdge.id)).toStrictEqual(updatedEdge.asEdge());
  });

  it("should not update canvas state when entities are not in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const vertex = createTestableVertex();
    const edge = createTestableEdge();

    explorer.addTestableVertex(vertex);
    explorer.addTestableEdge(edge);
    rawQuerySpy.mockResolvedValue([vertex.asResult(), edge.asResult()]);
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
