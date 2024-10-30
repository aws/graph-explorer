import { atom, selector } from "recoil";
import {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { activeConfigurationAtom } from "./configuration";
import isDefaultValue from "./isDefaultValue";
import { Edge, Vertex } from "@/@types/entities";
import { sanitizeText } from "@/utils";

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
      if (!newValue || isDefaultValue(newValue)) {
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      // Update the map
      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  },
});

type Entities = { nodes?: Vertex[]; edges?: Edge[] };

/** Write only atom that updates the schema based on the given nodes and edges. */
export const updateSchemaFromEntitiesAtom = selector<Entities>({
  key: "update-schema-from-entities",
  get: () => ({}),
  set({ set }, newValue) {
    set(activeSchemaSelector, prev => {
      if (!prev || isDefaultValue(newValue)) {
        return prev;
      }
      return updateSchemaFromEntities(newValue, prev);
    });
  },
});

/** Updates the schema based on the given nodes and edges. */
export function updateSchemaFromEntities(
  entities: Entities,
  schema: SchemaInference
) {
  const newVertexConfigs = (entities.nodes ?? []).map(extractConfigFromEntity);
  const newEdgeConfigs = (entities.edges ?? []).map(extractConfigFromEntity);

  return {
    ...schema,
    vertices: merge(schema.vertices, newVertexConfigs),
    edges: merge(schema.edges, newEdgeConfigs),
  } satisfies SchemaInference;
}

/** Merges new node or edge configs in to a set of existing node or edge configs. */
function merge<T extends VertexTypeConfig | EdgeTypeConfig>(
  existing: T[],
  newConfigs: T[]
): T[] {
  // Update existing nodes with new attributes
  const updated = existing.map(config => {
    const newConfig = newConfigs.find(vt => vt.type === config.type);

    // No attributes to update
    if (!newConfig) {
      return config;
    }

    // Find missing attributes
    const missingAttributes = newConfig.attributes.filter(
      newAttr => !config.attributes.find(attr => attr.name === newAttr.name)
    );

    return {
      ...config,
      attributes: [...config.attributes, ...missingAttributes],
    };
  });

  // Find missing vertex type configs
  const existingTypes = new Set(updated.map(vt => vt.type));
  const missing = newConfigs.filter(vt => !existingTypes.has(vt.type));

  // Combine all together
  return [...updated, ...missing];
}

/** Creates a type config from a given node or edge. */
export function extractConfigFromEntity<Entity extends Vertex | Edge>(
  entity: Entity
): Entity extends Vertex ? VertexTypeConfig : EdgeTypeConfig {
  return {
    type: entity.type,
    displayLabel: "",
    attributes: Object.keys(entity.attributes).map(attr => ({
      name: attr,
      displayLabel: sanitizeText(attr),
      hidden: false,
    })),
  };
}
