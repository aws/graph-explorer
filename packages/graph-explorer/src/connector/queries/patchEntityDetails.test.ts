import {
  createRandomEdge,
  createRandomVertex,
  FakeExplorer,
  makeEdgeVerticesFragments,
  makeFragment,
} from "@/utils/testing";
import { patchEntityDetails } from "./patchEntityDetails";
import { createScalar } from "@/core";
import { createQueryClient } from "@/core/queryClient";

describe("patchEntityDetails", () => {
  it("should return empty array", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const result = await patchEntityDetails(client, []);

    expect(result).toEqual([]);
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(0);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(0);
  });

  it("should return given entities when already fully materialized", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const entities = [
      createRandomVertex(),
      createRandomEdge(),
      createScalar({ name: "scalar", value: 42 }),
    ];

    const result = Array.from(await patchEntityDetails(client, entities));

    expect(result).toEqual(entities);
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(0);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(0);
  });

  it("should return given vertex with updated details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);
    const entities = [makeFragment(vertex)];

    const result = await patchEntityDetails(client, entities);

    expect(result).toEqual([vertex]);
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(1);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(0);
  });

  it("should return given edge with updated vertex details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createRandomEdge();
    explorer.addEdge(edge);
    const entities = [makeEdgeVerticesFragments(edge)];

    const result = await patchEntityDetails(client, entities);

    expect(result).toEqual([edge]);
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(1);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(0);
  });

  it("should return given fragment edge with updated edge and vertex details", async () => {
    const explorer = new FakeExplorer();
    const client = createQueryClient({ explorer });
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const edge = createRandomEdge();
    explorer.addEdge(edge);
    const entities = [makeEdgeVerticesFragments(makeFragment(edge))];

    const result = await patchEntityDetails(client, entities);

    expect(result).toEqual([edge]);
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(1);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(1);
  });
});
