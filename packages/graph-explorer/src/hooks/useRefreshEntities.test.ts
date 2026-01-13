import { useQueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";

import { vertexDetailsQuery, edgeDetailsQuery } from "@/connector";
import {
  createRandomEdge,
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import { useRefreshEntities } from "./useRefreshEntities";

describe("useRefreshEntities", () => {
  it("should refresh vertices and edges", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);

    const vertex = createRandomVertex();
    const edge = createRandomEdge();

    const cachedVertex = {
      ...vertex,
      attributes: { ...vertex.attributes, name: "Cached" },
    };
    const cachedEdge = {
      ...edge,
      attributes: { ...edge.attributes, weight: 1 },
    };

    // Add updated data to explorer
    const updatedVertex = {
      ...vertex,
      attributes: { ...vertex.attributes, name: "Updated" },
    };
    const updatedEdge = {
      ...edge,
      attributes: { ...edge.attributes, weight: 10 },
    };
    explorer.addVertex(updatedVertex);
    explorer.addEdge(updatedEdge);

    const { result } = renderHookWithState(() => {
      const queryClient = useQueryClient();
      const refreshHook = useRefreshEntities();

      return { queryClient, refreshHook };
    }, state);

    // Add cached data
    result.current.queryClient.setQueryData(
      vertexDetailsQuery(vertex.id).queryKey,
      {
        vertex: cachedVertex,
      },
    );
    result.current.queryClient.setQueryData(
      edgeDetailsQuery(edge.id).queryKey,
      {
        edge: cachedEdge,
      },
    );

    expect(result.current.refreshHook.isPending).toBe(false);

    act(() => {
      result.current.refreshHook.refresh({
        vertexIds: [vertex.id],
        edgeIds: [edge.id],
      });
    });

    await waitFor(() => {
      expect(result.current.refreshHook.isPending).toBe(false);
    });

    // Verify cache was updated with fresh data
    expect(
      result.current.queryClient.getQueryData(
        vertexDetailsQuery(vertex.id).queryKey,
      ),
    ).toStrictEqual({ vertex: updatedVertex });
    expect(
      result.current.queryClient.getQueryData(
        edgeDetailsQuery(edge.id).queryKey,
      ),
    ).toStrictEqual({ edge: updatedEdge });
  });

  it("should handle empty entity lists", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const { result } = renderHookWithState(() => useRefreshEntities(), state);

    act(() => {
      result.current.refresh({
        vertexIds: [],
        edgeIds: [],
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(vertexDetailsSpy).not.toHaveBeenCalled();
    expect(edgeDetailsSpy).not.toHaveBeenCalled();
  });

  it("should fetch vertices and edges in parallel", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);

    const vertex = createRandomVertex();
    const edge = createRandomEdge();
    explorer.addVertex(vertex);
    explorer.addEdge(edge);

    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");

    const { result } = renderHookWithState(() => useRefreshEntities(), state);

    act(() => {
      result.current.refresh({
        vertexIds: [vertex.id],
        edgeIds: [edge.id],
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Both should have been called
    expect(vertexDetailsSpy).toHaveBeenCalledTimes(1);
    expect(edgeDetailsSpy).toHaveBeenCalledTimes(1);
  });
});
