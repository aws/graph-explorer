// @vitest-environment happy-dom
import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { useQueryClient } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  type RawConfiguration,
  transformLegacyConnection,
} from "@/connections";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  getAppStore,
  schemaAtom,
} from "@/core";
import {
  createRandomRawConfiguration,
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import {
  type ConnectionFormValues,
  mapToConnectionForm,
} from "./connectionFormModel";
import { useUpdateConnection } from "./useUpdateConnection";

function saveUpdate(
  state: DbState,
  config: RawConfiguration,
  values: ConnectionFormValues,
) {
  const { result } = renderHookWithState(() => useUpdateConnection(), state);
  act(() => result.current(config, values));
}

describe("useUpdateConnection", () => {
  test("saves the connection and its name in place", () => {
    const state = new DbState().withActiveConnection({
      graphDbUrl: "https://database.example.com:8182",
      queryEngine: "gremlin",
    });
    const config = state.activeConfig;
    const name = createRandomName("Renamed");
    const values: ConnectionFormValues = {
      ...mapToConnectionForm(name, config.connection),
      fetchTimeoutEnabled: true,
      fetchTimeoutMs: 30000,
    };

    saveUpdate(state, config, values);

    const store = getAppStore();
    expect(store.get(configurationAtom).get(config.id)).toStrictEqual({
      id: config.id,
      displayLabel: name,
      connection: {
        graphDbUrl: "https://database.example.com:8182",
        queryEngine: "gremlin",
        awsAuthEnabled: false,
        serviceType: "neptune-db",
        awsRegion: "",
        fetchTimeoutMs: 30000,
        nodeExpansionLimit: undefined,
      },
    });
    expect(store.get(activeConfigurationAtom)).toBe(config.id);
  });

  test("refuses to update a connection that no longer exists", () => {
    const state = new DbState();
    const missing = createRandomRawConfiguration();
    const { result } = renderHookWithState(() => useUpdateConnection(), state);

    expect(() =>
      result.current(
        missing,
        mapToConnectionForm(createRandomName("Renamed"), missing.connection),
      ),
    ).toThrow(new Error(`Cannot update missing connection ${missing.id}`));
    expect(getAppStore().get(configurationAtom).has(missing.id)).toBe(false);
  });

  test("keeps the schema and graph session when the database is unchanged", () => {
    const state = new DbState().withActiveConnection({
      graphDbUrl: createRandomUrlString(),
      queryEngine: "gremlin",
    });
    state.addTestableVertexToGraph(createTestableVertex());
    const config = state.activeConfig;

    saveUpdate(
      state,
      config,
      mapToConnectionForm(createRandomName("Renamed"), config.connection),
    );

    const store = getAppStore();
    expect(store.get(schemaAtom).get(config.id)).toBe(state.activeSchema);
    expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(true);
  });

  test("clears the schema and graph session when the Database URL changes", () => {
    const state = new DbState().withActiveConnection({
      graphDbUrl: "https://database.example.com:8182",
      queryEngine: "gremlin",
    });
    state.addTestableVertexToGraph(createTestableVertex());
    const config = state.activeConfig;

    saveUpdate(state, config, {
      ...mapToConnectionForm(createRandomName("Renamed"), config.connection),
      graphDbUrl: "https://other-database.example.com:8182",
    });

    const store = getAppStore();
    expect(store.get(schemaAtom).has(config.id)).toBe(false);
    expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(false);
  });

  test("clears the schema and graph session when the Query Language changes", () => {
    const state = new DbState().withActiveConnection({
      graphDbUrl: createRandomUrlString(),
      queryEngine: "gremlin",
    });
    state.addTestableVertexToGraph(createTestableVertex());
    const config = state.activeConfig;

    saveUpdate(state, config, {
      ...mapToConnectionForm(createRandomName("Renamed"), config.connection),
      queryEngine: "openCypher",
    });

    const store = getAppStore();
    expect(store.get(schemaAtom).has(config.id)).toBe(false);
    expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(false);
  });

  test("clears the cached queries of the connection", () => {
    const state = new DbState();
    const config = state.activeConfig;
    const queryKey = [createRandomName("Query")];
    const { result } = renderHookWithState(
      () => ({
        updateConnection: useUpdateConnection(),
        queryClient: useQueryClient(),
      }),
      state,
    );
    result.current.queryClient.setQueryData(queryKey, createRandomName("Data"));

    act(() =>
      result.current.updateConnection(
        config,
        mapToConnectionForm(createRandomName("Renamed"), config.connection),
      ),
    );

    expect(result.current.queryClient.getQueryData(queryKey)).toBeUndefined();
  });

  /**
   * BACKWARD COMPATIBILITY: CONNECTIONS STORED BY AN EARLIER VERSION
   *
   * Older connections can be stored without `queryEngine`, which the app reads
   * as Gremlin, or as a proxied connection with `url` holding the proxy and
   * `graphDbUrl` the database, which is read through
   * `transformLegacyConnection`. Saving either unchanged must not look like a
   * new database and throw away its schema and graph session.
   *
   * Do not delete without confirming stored connections have been migrated.
   */
  describe("backward compatibility: saving a connection stored by an earlier version", () => {
    test("keeps the schema and graph session of a connection without a Query Language", () => {
      const state = new DbState().withActiveConnection({
        graphDbUrl: createRandomUrlString(),
      });
      state.addTestableVertexToGraph(createTestableVertex());
      const config = state.activeConfig;

      saveUpdate(
        state,
        config,
        mapToConnectionForm(createRandomName("Renamed"), config.connection),
      );

      const store = getAppStore();
      expect(store.get(schemaAtom).get(config.id)).toBe(state.activeSchema);
      expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(true);
    });

    test("keeps the schema and graph session of a legacy proxied connection", () => {
      const state = new DbState().withActiveConnection(
        transformLegacyConnection({
          url: createRandomUrlString(),
          proxyConnection: true,
          graphDbUrl: createRandomUrlString(),
          queryEngine: "gremlin",
        }),
      );
      state.addTestableVertexToGraph(createTestableVertex());
      const config = state.activeConfig;

      saveUpdate(
        state,
        config,
        mapToConnectionForm(createRandomName("Renamed"), config.connection),
      );

      const store = getAppStore();
      expect(store.get(schemaAtom).get(config.id)).toBe(state.activeSchema);
      expect(store.get(allGraphSessionsAtom).has(config.id)).toBe(true);
    });
  });
});
