// @vitest-environment happy-dom

import { waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { act } from "react";
import { expect, test } from "vitest";

import {
  activeConnectionIdAtom,
  allGraphSessionsAtom,
  savedConnectionsAtom,
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
  const connection1 = createRandomSavedConnection();

  const { result } = renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConnection();
      const allConnections = useAtomValue(savedConnectionsAtom);
      const activeConnectionId = useAtomValue(activeConnectionIdAtom);

      return { callback, allConnections, activeConnectionId };
    },
    store => {
      store.set(activeConnectionIdAtom, connection1.id);
      store.set(savedConnectionsAtom, new Map([[connection1.id, connection1]]));
    },
  );

  act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.activeConnectionId).toBeNull();
    expect(result.current.allConnections.size).toBe(0);
  });
});

test("should delete the active schema", async () => {
  const connection1 = createRandomSavedConnection();
  const schema1 = createRandomSchema();

  const { result } = renderHookWithJotai(
    () => {
      const callback = useDeleteActiveConnection();
      const allSchemas = useAtomValue(schemaAtom);

      return { callback, allSchemas };
    },
    store => {
      store.set(activeConnectionIdAtom, connection1.id);
      store.set(savedConnectionsAtom, new Map([[connection1.id, connection1]]));
      store.set(schemaAtom, new Map([[connection1.id, schema1]]));
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
