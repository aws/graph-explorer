// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { act } from "react";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  schemaAtom,
} from "@/core";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  DbState,
  renderHookWithJotai,
} from "@/utils/testing";

import { useDeleteActiveConfiguration } from "./useDeleteConfig";

test("should delete the active configuration", async () => {
  const config1 = createRandomRawConfiguration();

  const { result } = await renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConfiguration();
      const allConfigs = useAtomValue(configurationAtom);
      const activeConfig = useAtomValue(activeConfigurationAtom);

      return { callback, allConfigs, activeConfig };
    },
    async store => {
      await store.set(activeConfigurationAtom, config1.id);
      await store.set(configurationAtom, new Map([[config1.id, config1]]));
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.activeConfig).toBeNull();
    expect(result.current.allConfigs.size).toBe(0);
  });
});

test("should delete the active schema", async () => {
  const config1 = createRandomRawConfiguration();
  const schema1 = createRandomSchema();

  const { result } = await renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConfiguration();
      const allSchemas = useAtomValue(schemaAtom);

      return { callback, allSchemas };
    },
    async store => {
      await store.set(activeConfigurationAtom, config1.id);
      await store.set(configurationAtom, new Map([[config1.id, config1]]));
      await store.set(schemaAtom, new Map([[config1.id, schema1]]));
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

  const { result } = await renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConfiguration();
      const allGraphs = useAtomValue(allGraphSessionsAtom);

      return { callback, allGraphs };
    },
    async store => {
      await dbState.applyTo(store);
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.allGraphs.size).toBe(0);
  });
});
