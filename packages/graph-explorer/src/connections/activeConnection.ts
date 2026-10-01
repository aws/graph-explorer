import { atom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { isEqual } from "lodash";

import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/storageAtoms";

import { normalizeConnection } from "./normalizeConnection";

/** Gets the currently active config. */
export const activeConfigSelector = atom(get => {
  const configMap = get(configurationAtom);
  const id = get(activeConfigurationAtom);
  // The id may point at a connection deleted in another tab, so a map miss
  // resolves to null (no active connection) rather than a dangling pointer.
  return (id && configMap.get(id)) ?? null;
});

export const activeConnectionAtom = atom(get => {
  const connection = get(
    selectAtom(activeConfigSelector, c => c?.connection, isEqual),
  );
  if (!connection) {
    return null;
  }
  return normalizeConnection(connection);
});

export const queryEngineSelector = atom(get =>
  get(
    selectAtom(activeConnectionAtom, c =>
      c && c.queryEngine ? c.queryEngine : "gremlin",
    ),
  ),
);

export function useQueryEngine() {
  return useAtomValue(queryEngineSelector);
}
