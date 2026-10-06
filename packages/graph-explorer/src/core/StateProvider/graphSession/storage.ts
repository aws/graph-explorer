import { atom } from "jotai";
import { atomWithReset, RESET } from "jotai/utils";

import { activeConfigurationAtom, allGraphSessionsAtom } from "@/core";
import { type LayoutName, storedLayoutNameSchema } from "@/core/graphLayout";

import type { EdgeId, VertexId } from "../../entities";

/** A model for the graph data that is stored in local storage. */
export type GraphSessionStorageModel = {
  vertices: Set<VertexId>;
  edges: Set<EdgeId>;
  // Persisted but not the restore mechanism: the per-tab View Layout
  // (graphViewLayoutAlgorithmAtom) is the source of truth that restores the
  // layout on reload. Session restore deliberately does not read this field.
  layout: LayoutName;
};

export const isRestorePreviousSessionAvailableAtom = atomWithReset(true);

/** Gets or sets the active connection's graph session data. */
export const activeGraphSessionAtom = atom(
  get => {
    const connectionId = get(activeConfigurationAtom);

    if (!connectionId) {
      return null;
    }

    const graphs = get(allGraphSessionsAtom);
    const stored = graphs.get(connectionId);

    if (!stored) {
      return null;
    }

    // A legacy session predates the stored layout, so coerce at the read seam:
    // a missing value quietly takes the default, an unknown one warns.
    return { ...stored, layout: storedLayoutNameSchema.parse(stored.layout) };
  },
  (get, set, newValue: GraphSessionStorageModel | typeof RESET) => {
    const graphs = get(allGraphSessionsAtom);
    const connectionId = get(activeConfigurationAtom);

    // Do nothing if there is no active connection
    if (!connectionId) {
      return;
    }

    const newGraphs = new Map(graphs);

    // Delete the active graph if we receive a default value
    if (newValue === RESET || !newValue) {
      newGraphs.delete(connectionId);
      set(allGraphSessionsAtom, newGraphs);
      return;
    }

    newGraphs.set(connectionId, newValue);
    set(allGraphSessionsAtom, newGraphs);
  },
);
