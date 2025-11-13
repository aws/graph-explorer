import {
  createRandomVertex,
  createRandomVertexId,
  FakeExplorer,
} from "@/utils/testing";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { createQueryClient } from "@/core/queryClient";
import { getAppStore, nodesAtom } from "@/core";

describe("vertexDetailsQuery", () => {
  it("should return null when vertex is not found", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      vertexDetailsQuery(createRandomVertexId())
    );

    expect(result.vertex).toBeNull();
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    const result = await queryClient.fetchQuery(vertexDetailsQuery(vertex.id));

    expect(result.vertex).toEqual(vertex);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });

  it("should update nodesAtom when vertex is already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const originalVertex = createRandomVertex();
    const updatedVertex = {
      ...originalVertex,
      attributes: { ...originalVertex.attributes, name: "Updated Name" },
    };

    // Add original vertex to nodesAtom
    getAppStore().set(
      nodesAtom,
      new Map([[originalVertex.id, originalVertex]])
    );

    // Mock explorer to return updated vertex
    explorer.addVertex(updatedVertex);

    await queryClient.fetchQuery(vertexDetailsQuery(originalVertex.id));

    // Verify nodesAtom was updated with the new vertex data
    const nodesMap = getAppStore().get(nodesAtom);
    expect(nodesMap.get(originalVertex.id)).toStrictEqual(updatedVertex);
  });

  it("should not update nodesAtom when vertex is not in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    // nodesAtom is empty
    expect(getAppStore().get(nodesAtom).size).toBe(0);

    await queryClient.fetchQuery(vertexDetailsQuery(vertex.id));

    // Verify nodesAtom was not modified
    expect(getAppStore().get(nodesAtom).size).toBe(0);
  });
});
