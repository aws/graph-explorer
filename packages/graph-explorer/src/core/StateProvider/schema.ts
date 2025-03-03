import { atom, DefaultValue, selector, useRecoilCallback } from "recoil";
import {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { activeConfigurationAtom } from "./configuration";
import { Edge, Entities, toEdgeMap, toNodeMap, Vertex } from "@/core";
import { logger, sanitizeText } from "@/utils";
import generatePrefixes from "@/utils/generatePrefixes";
import { startTransition } from "react";

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
      if (newValue instanceof DefaultValue || !newValue) {
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      // Update the map
      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  },
});

type SchemaEntities = Pick<Entities, "nodes" | "edges">;

/** Updates the schema based on the given nodes and edges. */
export function updateSchemaFromEntities(
  entities: SchemaEntities,
  schema: SchemaInference
) {
  const newVertexConfigs = entities.nodes
    .values()
    .map(extractConfigFromEntity)
    .toArray();
  const newEdgeConfigs = entities.edges
    .values()
    .map(extractConfigFromEntity)
    .toArray();

  let newSchema = {
    ...schema,
    vertices: merge(schema.vertices, newVertexConfigs),
    edges: merge(schema.edges, newEdgeConfigs),
  } satisfies SchemaInference;

  // Update the generated prefixes in the schema
  newSchema = updateSchemaPrefixes(newSchema);

  logger.debug("Updated schema:", newSchema);
  return newSchema;
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
    const existingAttributes = new Set(
      config.attributes.map(attr => attr.name)
    );
    const missingAttributes = newConfig.attributes.filter(
      newAttr => !existingAttributes.has(newAttr.name)
    );

    if (missingAttributes.length === 0) {
      return config;
    }

    logger.debug(
      `Adding missing attributes to ${config.type}:`,
      missingAttributes
    );

    return {
      ...config,
      attributes: [...config.attributes, ...missingAttributes],
    };
  });

  // Find missing vertex type configs
  const existingTypes = new Set(updated.map(vt => vt.type));
  const missing = newConfigs.filter(vt => !existingTypes.has(vt.type));

  if (missing.length === 0) {
    return updated;
  }

  logger.debug(`Adding missing types:`, missing);

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

/** Generate RDF prefixes for all the resource URIs in the schema. */
export function updateSchemaPrefixes(schema: SchemaInference): SchemaInference {
  const existingPrefixes = schema.prefixes ?? [];

  // Get all the resource URIs from the vertex and edge type configs
  const resourceUris = schema.vertices
    .flatMap(v => [v.type, ...v.attributes.map(attr => attr.name)])
    .concat(schema.edges.map(e => e.type));

  if (resourceUris.length === 0) {
    return schema;
  }

  const genPrefixes = generatePrefixes(resourceUris, existingPrefixes);
  if (!genPrefixes?.length) {
    return schema;
  }

  logger.debug("Updating schema with prefixes:", genPrefixes);

  return {
    ...schema,
    prefixes: genPrefixes,
  };
}

/** Updates the schema with any new vertex or edge types, any new attributes, and updates the generated prefixes for sparql connections. */
export function useUpdateSchemaFromEntities() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (entities: { vertices: Vertex[]; edges: Edge[] }) => {
        const activeSchema = await snapshot.getPromise(activeSchemaSelector);
        if (entities.vertices.length === 0 && entities.edges.length === 0) {
          return;
        }
        if (!activeSchema) {
          return;
        }
        if (!shouldUpdateSchemaFromEntities(entities, activeSchema)) {
          logger.debug("Schema is already up to date with the given entities");
          return;
        }
        startTransition(() => {
          logger.debug("Updating schema from entities");
          set(activeSchemaSelector, prev => {
            if (!prev) {
              return prev;
            }
            return updateSchemaFromEntities(
              {
                nodes: toNodeMap(entities.vertices),
                edges: toEdgeMap(entities.edges),
              },
              prev
            );
          });
        });
      },
    []
  );
}

/** Attempts to efficiently detect if the schema should be updated. */
export function shouldUpdateSchemaFromEntities(
  entities: {
    vertices: Vertex[];
    edges: Edge[];
  },
  schema: SchemaInference
) {
  if (entities.vertices.length > 0) {
    // Check if the vertex types are the same
    const newVertexTypes = new Set(entities.vertices.map(n => n.type));
    const existingVertexTypes = new Set(schema.vertices.map(v => v.type));

    if (!existingVertexTypes.isSupersetOf(newVertexTypes)) {
      logger.debug(
        "Found new vertex types:",
        newVertexTypes.difference(existingVertexTypes)
      );
      return true;
    }

    // Check if the vertex attributes are the same
    const newVertexAttributes = new Set(
      entities.vertices.flatMap(n =>
        Object.keys(n.attributes).map(a => `${n.type}.${a}`)
      )
    );

    const existingVertexAttributes = new Set(
      schema.vertices.flatMap(v => v.attributes.map(a => `${v.type}.${a.name}`))
    );

    if (!existingVertexAttributes.isSupersetOf(newVertexAttributes)) {
      logger.debug(
        "Found new vertex attributes:",
        newVertexAttributes.difference(existingVertexAttributes)
      );
      return true;
    }
  }

  if (entities.edges.length > 0) {
    // Check if the edge types are the same
    const newEdgeTypes = new Set(entities.edges.map(e => e.type));
    const existingEdgeTypes = new Set(schema.edges.map(e => e.type));

    if (!existingEdgeTypes.isSupersetOf(newEdgeTypes)) {
      logger.debug(
        "Found new edge types:",
        newEdgeTypes.difference(existingEdgeTypes)
      );
      return true;
    }

    // Check if the edge attributes are the same
    const newEdgeAttributes = new Set(
      entities.edges.flatMap(e =>
        Object.keys(e.attributes).map(a => `${e.type}.${a}`)
      )
    );

    const existingEdgeAttributes = new Set(
      schema.edges.flatMap(e => e.attributes.map(a => `${e.type}.${a.name}`))
    );

    if (!existingEdgeAttributes.isSupersetOf(newEdgeAttributes)) {
      logger.debug(
        "Found new edge attributes:",
        newEdgeAttributes.difference(existingEdgeAttributes)
      );
      return true;
    }
  }

  return false;
}
