import type { QueryEngine } from "@shared/types";

import { createStore } from "jotai";
import { describe, expect, test } from "vitest";

import type { RawConfiguration } from "@/connections";

import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/storageAtoms";
import { createRandomRawConfiguration } from "@/utils/testing";

import {
  activeConfigSelector,
  activeConnectionAtom,
  queryEngineSelector,
} from "./activeConnection";

function connectionWithEngine(queryEngine: QueryEngine): RawConfiguration {
  const config = createRandomRawConfiguration();
  return {
    ...config,
    connection: { ...config.connection!, queryEngine },
  };
}

function storeWithActiveConnection(config: RawConfiguration) {
  const store = createStore();
  store.set(configurationAtom, new Map([[config.id, config]]));
  store.set(activeConfigurationAtom, config.id);
  return store;
}

describe("activeConfigSelector", () => {
  test("resolves the active connection's config", () => {
    const config = createRandomRawConfiguration();
    const store = storeWithActiveConnection(config);

    expect(store.get(activeConfigSelector)).toBe(config);
  });

  // A tab's active connection lives in per-tab sessionStorage, but the
  // connections map is shared and only refreshed on reload. A connection
  // deleted in another tab leaves this tab pointing at a missing id. The
  // selector must degrade to null (the connection screen) rather than expose a
  // dangling pointer.
  test("resolves to null when the active connection was deleted in another tab", () => {
    const deletedConfig = createRandomRawConfiguration();
    const store = createStore();
    store.set(configurationAtom, new Map());
    store.set(activeConfigurationAtom, deletedConfig.id);

    expect(store.get(activeConfigSelector)).toBeNull();
  });
});

describe("activeConnectionAtom", () => {
  test("resolves to null when there is no active connection", () => {
    const store = createStore();

    expect(store.get(activeConnectionAtom)).toBeNull();
  });

  test("resolves to null when the active connection has no connection details", () => {
    const config: RawConfiguration = {
      ...createRandomRawConfiguration(),
      connection: undefined,
    };
    const store = storeWithActiveConnection(config);

    expect(store.get(activeConnectionAtom)).toBeNull();
  });

  test("normalizes the active connection's URL and applies defaults", () => {
    const config: RawConfiguration = {
      ...createRandomRawConfiguration(),
      connection: { graphDbUrl: "https://neptune.example.com:8182/\n" },
    };
    const store = storeWithActiveConnection(config);

    expect(store.get(activeConnectionAtom)).toStrictEqual({
      graphDbUrl: "https://neptune.example.com:8182",
      queryEngine: "gremlin",
      awsAuthEnabled: false,
    });
  });
});

describe("queryEngineSelector", () => {
  test("falls back to gremlin when there is no active connection", () => {
    const store = createStore();

    expect(store.get(queryEngineSelector)).toBe("gremlin");
  });

  test.each(["gremlin", "openCypher", "sparql"] as const)(
    "reports the active connection's %s engine",
    queryEngine => {
      const store = storeWithActiveConnection(
        connectionWithEngine(queryEngine),
      );

      expect(store.get(queryEngineSelector)).toBe(queryEngine);
    },
  );
});
