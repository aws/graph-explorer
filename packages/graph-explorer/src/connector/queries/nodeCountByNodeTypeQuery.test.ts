import { createRandomInteger } from "@shared/utils/testing";

import { explorerForTestingAtom, getAppStore, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { createRandomVertexType, DbState, FakeExplorer } from "@/utils/testing";

import { nodeCountByNodeTypeQuery } from "./nodeCountByNodeTypeQuery";

describe("nodeCountByNodeTypeQuery", () => {
  it("should fetch vertex counts for the given node type", async () => {
    const explorer = new FakeExplorer();
    const vertexType = createRandomVertexType();
    const expectedTotal = createRandomInteger();

    const fetchVertexCountsByTypeSpy = vi
      .spyOn(explorer, "fetchVertexCountsByType")
      .mockResolvedValue({ total: expectedTotal });

    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      nodeCountByNodeTypeQuery(vertexType),
    );

    expect(result.total).toBe(expectedTotal);
    expect(fetchVertexCountsByTypeSpy).toHaveBeenCalledTimes(1);
    expect(fetchVertexCountsByTypeSpy).toHaveBeenCalledWith(
      { label: vertexType },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("should update schema with vertex total", async () => {
    const explorer = new FakeExplorer();
    const vertexType = createRandomVertexType();
    const expectedTotal = createRandomInteger();

    vi.spyOn(explorer, "fetchVertexCountsByType").mockResolvedValue({
      total: expectedTotal,
    });

    // Set up state with the vertex type in schema
    const state = new DbState(explorer);
    state.activeSchema.vertices = [{ type: vertexType, attributes: [] }];

    const store = getAppStore();
    state.applyTo(store);

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(nodeCountByNodeTypeQuery(vertexType));

    // Verify the schema was updated with the new total
    const schema = store.get(schemaAtom).get(state.activeConfig.id);
    const vertexConfig = schema?.vertices.find(v => v.type === vertexType);
    expect(vertexConfig?.total).toBe(expectedTotal);
  });

  it("should pass abort signal to explorer", async () => {
    const explorer = new FakeExplorer();
    const vertexType = createRandomVertexType();

    const fetchVertexCountsByTypeSpy = vi
      .spyOn(explorer, "fetchVertexCountsByType")
      .mockResolvedValue({ total: 0 });

    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    await queryClient.fetchQuery(nodeCountByNodeTypeQuery(vertexType));

    expect(fetchVertexCountsByTypeSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("should have correct query key", () => {
    const nodeType = createRandomVertexType();

    const options = nodeCountByNodeTypeQuery(nodeType);

    expect(options.queryKey).toStrictEqual([
      "schema",
      "vertex-type",
      nodeType,
      "count",
    ]);
  });

  it("should not throw when no schema exists", async () => {
    const explorer = new FakeExplorer();
    const vertexType = createRandomVertexType();
    const expectedTotal = createRandomInteger();

    vi.spyOn(explorer, "fetchVertexCountsByType").mockResolvedValue({
      total: expectedTotal,
    });

    getAppStore().set(explorerForTestingAtom, explorer);
    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      nodeCountByNodeTypeQuery(vertexType),
    );

    expect(result.total).toBe(expectedTotal);
  });
});
