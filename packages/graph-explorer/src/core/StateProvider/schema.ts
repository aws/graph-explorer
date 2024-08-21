import { atom, selector } from "recoil";
import {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { activeConfigurationAtom } from "./configuration";
import isDefaultValue from "./isDefaultValue";

export type SchemaInference = {
  vertices: VertexTypeConfig[];
  edges: EdgeTypeConfig[];
  prefixes?: Array<PrefixTypeConfig>;
  lastUpdate?: Date;
  triedToSync?: boolean;
  lastSyncFail?: boolean;
  totalVertices?: number;
  totalEdges?: number;
};

export const schemaAtom = atom<Map<string, SchemaInference>>({
  key: "schema",
  default: new Map(),
  effects: [localForageEffect()],
});

export const activeSchemaSelector = selector({
  key: "active-schema",
  get({ get }) {
    const schemaMap = get(schemaAtom);
    const id = get(activeConfigurationAtom);
    const activeSchema = id ? schemaMap.get(id) : null;
    return activeSchema;
  },
  set({ get, set }, newValue) {
    const schemaId = get(activeConfigurationAtom);
    if (!schemaId) {
      return;
    }
    set(schemaAtom, prevSchemaMap => {
      const updatedSchemaMap = new Map(prevSchemaMap);

      // Handle reset value
      if (isDefaultValue(newValue) || !newValue) {
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      // Update the map
      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  },
});
