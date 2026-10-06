import type { QueryEngine } from "@shared/types";

import { createStore } from "jotai";
import { describe, expect, test } from "vitest";

import type { SavedConnection } from "@/connections";

import {
  activeConnectionIdAtom,
  savedConnectionsAtom,
} from "@/core/StateProvider/storageAtoms";
import { createRandomSavedConnection } from "@/utils/testing";

import {
  activeSavedConnectionSelector,
  activeConnectionAtom,
  queryEngineSelector,
} from "./activeConnection";

function connectionWithEngine(queryEngine: QueryEngine): SavedConnection {
  const connection = createRandomSavedConnection();
  return {
    ...connection,
    connection: { ...connection.connection!, queryEngine },
  };
}

function storeWithActiveConnection(connection: SavedConnection) {
  const store = createStore();
  store.set(savedConnectionsAtom, new Map([[connection.id, connection]]));
  store.set(activeConnectionIdAtom, connection.id);
  return store;
}

describe("activeSavedConnectionSelector", () => {
  test("resolves the active saved connection", () => {
    const connection = createRandomSavedConnection();
    const store = storeWithActiveConnection(connection);

    expect(store.get(activeSavedConnectionSelector)).toBe(connection);
  });

  // A tab's active connection lives in per-tab sessionStorage, but the
  // connections map is shared and only refreshed on reload. A connection
  // deleted in another tab leaves this tab pointing at a missing id. The
  // selector must degrade to null (the connection screen) rather than expose a
  // dangling pointer.
  test("resolves to null when the active connection was deleted in another tab", () => {
    const deletedConnection = createRandomSavedConnection();
    const store = createStore();
    store.set(savedConnectionsAtom, new Map());
    store.set(activeConnectionIdAtom, deletedConnection.id);

    expect(store.get(activeSavedConnectionSelector)).toBeNull();
  });
});

describe("activeConnectionAtom", () => {
  test("resolves to null when there is no active connection", () => {
    const store = createStore();

    expect(store.get(activeConnectionAtom)).toBeNull();
  });

  test("resolves to null when the active connection has no connection details", () => {
    const connection: SavedConnection = {
      ...createRandomSavedConnection(),
      connection: undefined,
    };
    const store = storeWithActiveConnection(connection);

    expect(store.get(activeConnectionAtom)).toBeNull();
  });

  test("normalizes the active connection's URL and applies defaults", () => {
    const connection: SavedConnection = {
      ...createRandomSavedConnection(),
      connection: { graphDbUrl: "https://neptune.example.com:8182/\n" },
    };
    const store = storeWithActiveConnection(connection);

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
