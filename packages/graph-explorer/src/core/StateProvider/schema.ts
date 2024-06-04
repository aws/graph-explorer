import { atom, selector } from "recoil";
import {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { activeConfigurationAtom } from "./configuration";

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
  get: ({ get }) => {
    const activeConfigId = get(activeConfigurationAtom);
    if (!activeConfigId) {
      return;
    }
    const schemas = get(schemaAtom);
    return schemas.get(activeConfigId);
  },
});
