import { atom } from "jotai";
import { EdgeId, VertexId } from "../../entities";
import { activeConfigurationAtom } from "../configuration";
import { ConfigurationId } from "../../ConfigurationProvider";
import { atomWithLocalForage } from "../localForageEffect";
import { atomWithReset, RESET } from "jotai/utils";

/** A model for the graph data that is stored in local storage. */
export type GraphSessionStorageModel = {
  vertices: Set<VertexId>;
  edges: Set<EdgeId>;
};

export const isRestorePreviousSessionAvailableAtom = atomWithReset(true);

/** Stores the graph session data for each connection. */
export const allGraphSessionsAtom = atomWithLocalForage(
  new Map<ConfigurationId, GraphSessionStorageModel>(),
  "graph-sessions"
);

/** Gets or sets the active connection's graph session data. */
export const activeGraphSessionAtom = atom(
  get => {
    const connectionId = get(activeConfigurationAtom);

    if (!connectionId) {
      return null;
    }

    const graphs = get(allGraphSessionsAtom);
    return graphs.get(connectionId) ?? null;
  },
  async (get, set, newValue: GraphSessionStorageModel | typeof RESET) => {
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
    await set(allGraphSessionsAtom, newGraphs);
  }
);
