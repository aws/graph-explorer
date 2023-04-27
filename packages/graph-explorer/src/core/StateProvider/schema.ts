import { atom } from "recoil";
import {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import localForageEffect from "./localForageEffect";

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
