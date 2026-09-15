import { atom, useAtomValue, useSetAtom } from "jotai";

import type { VertexType } from "../entities";

import { activeConfigurationAtom, hiddenSchemaTypesAtom } from "./storageAtoms";

const EMPTY_HIDDEN_TYPES: ReadonlySet<VertexType> = new Set();

/**
 * The active connection's hidden Schema-view vertex types. Reads fall back to a
 * shared empty set for referential stability; writes delete the connection's
 * entry once its set empties, keeping storage clean.
 */
export const activeHiddenSchemaTypesAtom = atom(
  get => {
    const id = get(activeConfigurationAtom);
    return (id && get(hiddenSchemaTypesAtom).get(id)) ?? EMPTY_HIDDEN_TYPES;
  },
  (get, set, update: (prev: ReadonlySet<VertexType>) => Set<VertexType>) => {
    const id = get(activeConfigurationAtom);
    if (!id) {
      return;
    }
    set(hiddenSchemaTypesAtom, prev => {
      const current = prev.get(id) ?? EMPTY_HIDDEN_TYPES;
      const next = update(current);
      const map = new Map(prev);
      if (next.size === 0) {
        map.delete(id);
      } else {
        map.set(id, next);
      }
      return map;
    });
  },
);

/** Read the active connection's hidden vertex types plus hide/show/toggle actions. */
export function useHiddenSchemaTypes() {
  const hiddenTypes = useAtomValue(activeHiddenSchemaTypesAtom);
  const setHidden = useSetAtom(activeHiddenSchemaTypesAtom);
  return {
    hiddenTypes,
    isHidden: (type: VertexType) => hiddenTypes.has(type),
    toggleType: (type: VertexType) =>
      setHidden(prev => {
        const next = new Set(prev);
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
        return next;
      }),
  };
}
