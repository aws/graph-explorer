import { createQueryClient } from "@/core/queryClient";
import {
  createRandomEdge,
  createRandomVertex,
  FakeExplorer,
  makeEdgeVerticesFragments,
  makeFragment,
} from "@/utils/testing";
import { executeUserQuery } from "./executeUserQuery";
import { createScalar, getAllGraphableEntities } from "@/core";

describe("executeQuery", () => {
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

    expect(result).toEqual([]);
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

    const vertex = createRandomVertex();
    rawQuerySpy.mockResolvedValue([vertex]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual([vertex]);
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

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);
    rawQuerySpy.mockResolvedValue([makeFragment(vertex)]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual([vertex]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query with edge result", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    rawQuerySpy.mockResolvedValue([edge]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual([edge]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
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

    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    explorer.addEdge(edge);
    rawQuerySpy.mockResolvedValue([makeFragment(edge)]);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual([edge]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });

  it("should execute a query and pass through scalars", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex1 = createRandomVertex();
    const vertex2 = createRandomVertex();
    const edge = createRandomEdge(vertex1, vertex2);
    explorer.addVertex(vertex1);
    explorer.addVertex(vertex2);
    explorer.addEdge(edge);
    const queryResult = [
      makeFragment(vertex1),
      makeFragment(vertex2),
      makeEdgeVerticesFragments(makeFragment(edge)),
      createScalar({ name: "scalar1", value: 42 }),
      createScalar({ name: "scalar2", value: "hello" }),
    ];
    rawQuerySpy.mockResolvedValue(queryResult);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual([
      vertex1,
      vertex2,
      edge,
      ...queryResult.filter(r => r.entityType === "scalar"),
    ]);
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(
      getAllGraphableEntities(result)
    );
  });
});
