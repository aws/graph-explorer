import { atom, DefaultValue, selector } from "recoil";
import { EdgeId, VertexId } from "../../entities";
import { activeConfigurationAtom } from "../configuration";
import { ConfigurationId } from "../../ConfigurationProvider";
import localForageEffect from "../localForageEffect";

/** A model for the graph data that is stored in local storage. */
export type GraphSessionStorageModel = {
  vertices: Set<VertexId>;
  edges: Set<EdgeId>;
};

export const isRestorePreviousSessionAvailableAtom = atom({
  key: "is-restore-previous-session-available",
  default: true,
});

/** Stores the graph session data for each connection. */
export const allGraphSessionsAtom = atom({
  key: "graph-sessions",
  default: new Map<ConfigurationId, GraphSessionStorageModel>(),
  effects: [localForageEffect()],
});

/** Gets or sets the active connection's graph session data. */
export const activeGraphSessionAtom = selector({
  key: "active-graph-session",
  get: ({ get }) => {
    const connectionId = get(activeConfigurationAtom);

    if (!connectionId) {
      return null;
    }

    const graphs = get(allGraphSessionsAtom);
    return graphs.get(connectionId) ?? null;
  },
  set: ({ get, set }, newValue) => {
    const graphs = get(allGraphSessionsAtom);
    const connectionId = get(activeConfigurationAtom);

    // Do nothing if there is no active connection
    if (!connectionId) {
      return;
    }

    const newGraphs = new Map(graphs);

    // Delete the active graph if we receive a default value
    if (newValue instanceof DefaultValue || !newValue) {
      newGraphs.delete(connectionId);
      set(allGraphSessionsAtom, newGraphs);
      return;
    }

    newGraphs.set(connectionId, newValue);
    set(allGraphSessionsAtom, newGraphs);
  },
});
