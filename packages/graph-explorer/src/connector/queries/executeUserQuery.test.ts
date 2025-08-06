import { createQueryClient } from "@/core/queryClient";
import {
  createRandomEdge,
  createRandomVertex,
  FakeExplorer,
  makeFragment,
} from "@/utils/testing";
import { executeUserQuery } from "./executeUserQuery";
import { toMappedQueryResults } from "../useGEFetchTypes";
import { createScalar } from "@/core";

describe("executeQuery", () => {
  it("should execute a query with empty results", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    rawQuerySpy.mockResolvedValue(toMappedQueryResults({}));
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(toMappedQueryResults({}));
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should execute a query with vertex results", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createRandomVertex();
    rawQuerySpy.mockResolvedValue(toMappedQueryResults({ vertices: [vertex] }));
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(toMappedQueryResults({ vertices: [vertex] }));
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should execute a query with vertex fragment results and fetch details", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);
    rawQuerySpy.mockResolvedValue(
      toMappedQueryResults({ vertices: [makeFragment(vertex)] })
    );
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(toMappedQueryResults({ vertices: [vertex] }));
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should execute a query with edge result", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    rawQuerySpy.mockResolvedValue(toMappedQueryResults({ edges: [edge] }));
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(toMappedQueryResults({ edges: [edge] }));
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should execute a query with edge fragment result and fetch details", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    explorer.addEdge(edge);
    rawQuerySpy.mockResolvedValue(
      toMappedQueryResults({ edges: [makeFragment(edge)] })
    );
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(toMappedQueryResults({ edges: [edge] }));
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
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
    const queryResult = toMappedQueryResults({
      vertices: [makeFragment(vertex1), makeFragment(vertex2)],
      edges: [edge],
      scalars: [
        createScalar({ name: "scalar1", value: 42 }),
        createScalar({ name: "scalar2", value: "hello" }),
      ],
    });
    rawQuerySpy.mockResolvedValue(queryResult);
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      executeUserQuery("query", mockUpdateSchema)
    );

    expect(result).toEqual(
      toMappedQueryResults({
        vertices: [vertex1, vertex2],
        edges: [edge],
        scalars: queryResult.scalars,
      })
    );
    expect(rawQuerySpy).toBeCalledTimes(1);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });
});
