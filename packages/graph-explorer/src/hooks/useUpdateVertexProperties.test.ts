// @vitest-environment happy-dom
import { useQueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";

import { vertexDetailsQuery } from "@/connector";
import { createResultVertex } from "@/connector/entities";
import { createVertex, getRawId } from "@/core";
import {
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import { useUpdateVertexProperties } from "./useUpdateVertexProperties";

function gremlinExplorer() {
  const explorer = new FakeExplorer();
  // Force the engine so the random connection engine can't flake the guard.
  explorer.connection = { ...explorer.connection, queryEngine: "gremlin" };
  return explorer;
}

describe("useUpdateVertexProperties", () => {
  it("issues a Gremlin property update and refreshes the details cache", async () => {
    const explorer = gremlinExplorer();
    const state = new DbState(explorer);

    const vertex = createRandomVertex();
    const updatedAttributes = { ...vertex.attributes, name: "Updated" };

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery").mockResolvedValue({
      results: [
        createResultVertex({
          id: getRawId(vertex.id),
          types: vertex.types,
          attributes: updatedAttributes,
        }),
      ],
      rawResponse: {},
    });

    const { result } = renderHookWithState(() => {
      const queryClient = useQueryClient();
      const hook = useUpdateVertexProperties();
      return { queryClient, hook };
    }, state);

    act(() => {
      void result.current.hook.updateVertexProperties({
        vertexId: vertex.id,
        properties: { name: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.hook.isPending).toBe(false);
    });

    expect(rawQuerySpy).toHaveBeenCalledTimes(1);
    expect(rawQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining('.property("name", "Updated")'),
      }),
    );

    expect(
      result.current.queryClient.getQueryData(
        vertexDetailsQuery(vertex.id).queryKey,
      ),
    ).toStrictEqual({
      vertex: createVertex({
        id: getRawId(vertex.id),
        types: vertex.types,
        attributes: updatedAttributes,
      }),
    });
  });

  it("rejects when the connection is not Gremlin", async () => {
    const explorer = new FakeExplorer();
    explorer.connection = {
      ...explorer.connection,
      queryEngine: "openCypher",
    };
    const state = new DbState(explorer);

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    const { result } = renderHookWithState(
      () => useUpdateVertexProperties(),
      state,
    );

    await expect(
      result.current.updateVertexProperties({
        vertexId: createRandomVertex().id,
        properties: { name: "Updated" },
      }),
    ).rejects.toThrow("only supported on Gremlin");

    expect(rawQuerySpy).not.toHaveBeenCalled();
  });
});
