// @vitest-environment happy-dom
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activeConfigurationAtom,
  configurationAtom,
  createEdgeType,
  createVertexType,
  type EdgeConnection,
  explorerForTestingAtom,
  schemaAtom,
} from "@/core";
import { getAppStore } from "@/core/StateProvider/appStore";
import {
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomVertexTypeConfig,
  DbState,
  FakeExplorer,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import {
  useCancelSchemaSync,
  useIsSyncing,
  useSchemaSync,
} from "./useSchemaSync";

describe("useSchemaSync", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  /** Creates a DbState with the given vertex and edge types in the schema. */
  function createStateWithSchema(
    vertexTypes: ReturnType<typeof createVertexType>[],
    edgeTypes: ReturnType<typeof createEdgeType>[],
  ) {
    const state = new DbState(explorer);
    state.activeSchema.vertices = vertexTypes.map(type => ({
      type,
      attributes: [],
    }));
    state.activeSchema.edges = edgeTypes.map(type => ({
      type,
      attributes: [],
    }));
    // Clear edge connections so the query will fetch
    state.activeSchema.edgeConnections = undefined;
    return state;
  }

  describe("no active connection", () => {
    function renderWithNoConnection() {
      return renderHookWithJotai(
        () => useSchemaSync(),
        store => {
          void store.set(activeConfigurationAtom, null);
          void store.set(configurationAtom, new Map());
          void store.set(schemaAtom, new Map());
          store.set(explorerForTestingAtom, explorer);
        },
      );
    }

    it("should not fetch schema when no connection exists", () => {
      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderWithNoConnection();

      expect(fetchSchemaSpy).not.toHaveBeenCalled();
      expect(result.current.schemaDiscoveryQuery.fetchStatus).toBe("idle");
    });

    it("should not fetch edge connections when no connection exists", () => {
      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderWithNoConnection();

      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
      expect(result.current.edgeDiscoveryQuery.fetchStatus).toBe("idle");
    });

    it("should report isFetching as false when no connection exists", () => {
      const { result } = renderWithNoConnection();

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("schemaDiscoveryQuery", () => {
    it("should use initialData from active schema without fetching", () => {
      const vertexType = createVertexType("Person");
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([vertexType], [edgeType]);

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.schemaDiscoveryQuery.data?.vertices).toHaveLength(
        1,
      );
      expect(result.current.schemaDiscoveryQuery.data?.edges).toHaveLength(1);
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });

    it("should fetch schema when no active schema exists", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.schemaDiscoveryQuery.data).toBeUndefined();
      expect(fetchSchemaSpy).toHaveBeenCalled();
    });
  });

  describe("edgeDiscoveryQuery", () => {
    it("should fetch edge connections when schema has edges", () => {
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([], [edgeType]);

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      renderHookWithState(() => useSchemaSync(), state);

      expect(fetchEdgeConnectionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ edgeTypes: [edgeType] }),
        expect.anything(),
      );
    });

    it("should not call explorer when schema has no edges", async () => {
      const state = createStateWithSchema([], []);

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      renderHookWithState(() => useSchemaSync(), state);

      const store = getAppStore();

      await waitFor(() => {
        const activeSchema = store.get(schemaAtom).get(state.activeConfig.id);
        expect(activeSchema?.edgeConnections).toStrictEqual([]);
      });

      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });

    it("should not fetch edge connections when no active schema exists", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.fetchStatus).toBe("idle");
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });

    it("should use existing edge connections as initialData", () => {
      const edgeType = createEdgeType("knows");
      const sourceType = createVertexType("Person");
      const targetType = createVertexType("Company");

      const existingConnections: EdgeConnection[] = [
        {
          edgeType,
          sourceVertexType: sourceType,
          targetVertexType: targetType,
        },
      ];

      const state = new DbState(explorer);
      state.activeSchema.edges = [{ type: edgeType, attributes: [] }];
      state.activeSchema.edgeConnections = existingConnections;

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.data).toStrictEqual(
        existingConnections,
      );
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });

    it("should use empty edge connections array as initialData", () => {
      const state = new DbState(explorer);
      state.activeSchema.edges = [
        { type: createEdgeType("knows"), attributes: [] },
      ];
      state.activeSchema.edgeConnections = [];

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.data).toStrictEqual([]);
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });

    it("should use all edge connections as initialData without filtering", () => {
      const edgeType1 = createEdgeType("knows");
      const edgeType2 = createEdgeType("worksAt");
      const sourceType = createVertexType("Person");
      const targetType = createVertexType("Company");

      const existingConnections: EdgeConnection[] = [
        {
          edgeType: edgeType1,
          sourceVertexType: sourceType,
          targetVertexType: targetType,
        },
        {
          edgeType: edgeType2,
          sourceVertexType: sourceType,
          targetVertexType: targetType,
        },
      ];

      const state = new DbState(explorer);
      // Only include edgeType1 in the schema edges
      state.activeSchema.edges = [{ type: edgeType1, attributes: [] }];
      state.activeSchema.edgeConnections = existingConnections;

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.data).toStrictEqual(
        existingConnections,
      );
    });
  });

  describe("isFetching", () => {
    it("should be false when neither query is fetching", async () => {
      const state = createStateWithSchema([], []);
      // Set edge connections so edge discovery doesn't run
      state.activeSchema.edgeConnections = [];

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });

    it("should be true when schema discovery is fetching", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      // Make fetchSchema hang to keep isFetching true
      vi.spyOn(explorer, "fetchSchema").mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.isFetching).toBe(true);
    });

    it("should be true when edge discovery is fetching", () => {
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([], [edgeType]);

      // Make fetchEdgeConnections hang to keep isFetching true
      vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.isFetching).toBe(true);
    });
  });

  describe("refreshSchema", () => {
    it("should refetch schema discovery query", async () => {
      const state = createStateWithSchema([], []);
      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Initial render doesn't fetch because initialData is provided
      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchSchemaSpy).toHaveBeenCalledTimes(1);
    });

    it("should refetch edge discovery query", async () => {
      const edgeType = createEdgeType("worksAt");
      const state = createStateWithSchema([], [edgeType]);
      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      await waitFor(() => {
        expect(fetchEdgeConnectionsSpy).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchEdgeConnectionsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("staleTime behavior", () => {
    it("should not fetch schema when initialData exists", () => {
      const state = new DbState(explorer);

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Should use initialData but not fetch
      expect(result.current.schemaDiscoveryQuery.data).toBeDefined();
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });

    it("should fetch schema when no active schema exists", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      renderHookWithState(() => useSchemaSync(), state);

      expect(fetchSchemaSpy).toHaveBeenCalled();
    });

    it("should allow manual refresh when initialData exists", async () => {
      const state = new DbState(explorer);
      state.activeSchema.vertices = [createRandomVertexTypeConfig()];
      state.activeSchema.edges = [createRandomEdgeTypeConfig()];

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Auto-fetch should not happen because initialData is fresh
      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      // Manual refresh should still work
      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchSchemaSpy).toHaveBeenCalledTimes(1);
    });

    it("should not auto-fetch when lastSyncFail is true", () => {
      const state = new DbState(explorer);
      state.activeSchema.lastSyncFail = true;

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.schemaDiscoveryQuery.data).toBeDefined();
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });

    it("should allow manual refresh when lastSyncFail is true", async () => {
      const state = new DbState(explorer);
      state.activeSchema.lastSyncFail = true;
      state.activeSchema.vertices = [createRandomVertexTypeConfig()];
      state.activeSchema.edges = [createRandomEdgeTypeConfig()];

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchSchemaSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("remount behavior", () => {
    it("should not auto-fetch when lastSyncFail is true after remount", () => {
      // Simulate: sync failed, user navigated away, then came back.
      // Start with lastSyncFail already set (as if a previous sync failed).
      const state = new DbState(explorer);
      state.activeSchema.lastSyncFail = true;

      const fetchSchemaSpy = vi
        .spyOn(explorer, "fetchSchema")
        .mockRejectedValue(new Error("Network error"));

      // First mount — sync should not fire due to lastSyncFail
      const { unmount } = renderHookWithState(() => useSchemaSync(), state);
      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      // User navigates away
      unmount();

      // User navigates back — re-render with same state
      renderHookWithState(() => useSchemaSync(), state);

      // Should still not auto-fetch because lastSyncFail is true
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });
  });

  describe("connection switching", () => {
    it("should fetch schema when switching to a connection with no schema", async () => {
      const state = new DbState(explorer);
      state.activeSchema.vertices = [createRandomVertexTypeConfig()];

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result, rerender } = renderHookWithState(
        () => useSchemaSync(),
        state,
      );

      // Should not fetch because initialData exists
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
      expect(result.current.schemaDiscoveryQuery.data).toBeDefined();

      // Switch to a new connection with no schema
      const store = getAppStore();
      const newConfig = createRandomRawConfiguration();
      await store.set(configurationAtom, prev => {
        const updated = new Map(prev);
        updated.set(newConfig.id, newConfig);
        return updated;
      });
      await store.set(activeConfigurationAtom, newConfig.id);

      rerender();

      await waitFor(() => {
        expect(fetchSchemaSpy).toHaveBeenCalled();
      });
    });
  });

  describe("lastEdgeConnectionSyncFail", () => {
    it("should not auto-fetch edge connections when lastEdgeConnectionSyncFail is true", () => {
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([], [edgeType]);
      state.activeSchema.lastEdgeConnectionSyncFail = true;
      state.activeSchema.edgeConnections = undefined;

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.fetchStatus).toBe("idle");
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });
  });
});

describe("useIsSyncing", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  it("should return false when no schema queries are running", () => {
    const state = new DbState(explorer);

    const { result } = renderHookWithState(() => useIsSyncing(), state);

    expect(result.current).toBe(false);
  });

  it("should return true when a schema query is fetching", () => {
    const state = new DbState(explorer).withNoActiveSchema();

    vi.spyOn(explorer, "fetchSchema").mockImplementation(
      () => new Promise(() => {}),
    );

    // Both hooks must share the same query client to observe fetching state
    const { result } = renderHookWithState(
      () => ({ syncing: useIsSyncing(), schema: useSchemaSync() }),
      state,
    );

    expect(result.current.syncing).toBe(true);
  });
});

describe("useCancelSchemaSync", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  it("should return a function", () => {
    const state = new DbState(explorer);

    const { result } = renderHookWithState(() => useCancelSchemaSync(), state);

    expect(typeof result.current).toBe("function");
  });

  it("should cancel in-flight schema queries", async () => {
    const state = new DbState(explorer).withNoActiveSchema();

    const fetchSchemaSpy = vi
      .spyOn(explorer, "fetchSchema")
      .mockImplementation(() => new Promise(() => {}));

    const { result } = renderHookWithState(
      () => ({
        cancel: useCancelSchemaSync(),
        schema: useSchemaSync(),
      }),
      state,
    );

    // Schema fetch should have been triggered
    expect(fetchSchemaSpy).toHaveBeenCalled();

    // Cancel should not throw
    await act(async () => {
      await result.current.cancel();
    });
  });
});
