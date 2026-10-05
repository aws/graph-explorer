import type { QueryEngine } from "@shared/types";

import { createStore } from "jotai";
import { describe, expect, test } from "vitest";

import type { SavedConnection } from "@/connections";

import { emptyExplorer } from "@/connector/emptyExplorer";
import { createRandomSavedConnection } from "@/utils/testing";

import { explorerAtom, explorerForTestingAtom } from "./connector";
import { activeConfigurationAtom, configurationAtom } from "./StateProvider";

function connectionWithEngine(queryEngine: QueryEngine): SavedConnection {
  const config = createRandomSavedConnection();
  return {
    ...config,
    connection: { ...config.connection!, queryEngine },
  };
}

function storeWithActiveConnection(config: SavedConnection) {
  const store = createStore();
  store.set(configurationAtom, new Map([[config.id, config]]));
  store.set(activeConfigurationAtom, config.id);
  return store;
}

describe("explorerAtom", () => {
  test("returns the empty explorer when there is no active connection", () => {
    const store = createStore();

    expect(store.get(explorerAtom)).toBe(emptyExplorer);
  });

  test.each(["gremlin", "openCypher", "sparql"] as const)(
    "builds the %s explorer for the active connection",
    queryEngine => {
      const store = storeWithActiveConnection(
        connectionWithEngine(queryEngine),
      );

      expect(store.get(explorerAtom).connection.queryEngine).toBe(queryEngine);
    },
  );

  test("honors the explorerForTestingAtom override", () => {
    const store = storeWithActiveConnection(connectionWithEngine("sparql"));
    const override = { ...emptyExplorer };
    store.set(explorerForTestingAtom, override);

    expect(store.get(explorerAtom)).toBe(override);
  });
});
