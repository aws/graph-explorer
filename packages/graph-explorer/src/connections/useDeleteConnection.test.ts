// @vitest-environment happy-dom

import { waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { act } from "react";
import { expect, test } from "vitest";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  schemaAtom,
} from "@/core/StateProvider/storageAtoms";
import {
  createRandomSavedConnection,
  createRandomSchema,
  createRandomVertex,
  DbState,
  renderHookWithJotai,
} from "@/utils/testing";

import { useDeleteActiveConnection } from "./useDeleteConnection";

test("should delete the active configuration", async () => {
  const config1 = createRandomSavedConnection();

  const { result } = renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConnection();
      const allConfigs = useAtomValue(configurationAtom);
      const activeConfig = useAtomValue(activeConfigurationAtom);

      return { callback, allConfigs, activeConfig };
    },
    store => {
      store.set(activeConfigurationAtom, config1.id);
      store.set(configurationAtom, new Map([[config1.id, config1]]));
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.activeConfig).toBeNull();
    expect(result.current.allConfigs.size).toBe(0);
  });
});

test("should delete the active schema", async () => {
  const config1 = createRandomSavedConnection();
  const schema1 = createRandomSchema();

  const { result } = renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConnection();
      const allSchemas = useAtomValue(schemaAtom);

      return { callback, allSchemas };
    },
    store => {
      store.set(activeConfigurationAtom, config1.id);
      store.set(configurationAtom, new Map([[config1.id, config1]]));
      store.set(schemaAtom, new Map([[config1.id, schema1]]));
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.allSchemas.size).toBe(0);
  });
});

test("should delete the graph session for the active connection", async () => {
  const dbState = new DbState();
  dbState.addVertexToGraph(createRandomVertex());

  const { result } = renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConnection();
      const allGraphs = useAtomValue(allGraphSessionsAtom);

      return { callback, allGraphs };
    },
    store => {
      dbState.applyTo(store);
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.allGraphs.size).toBe(0);
  });
});
