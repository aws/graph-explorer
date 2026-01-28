import type { Simplify } from "type-fest";

import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai-family";
import { RESET, useAtomCallback } from "jotai/utils";
import { startTransition, useCallback, useDeferredValue } from "react";

import type {
  AttributeConfig,
  ConfigurationId,
  EdgeConnection,
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import type { SetStateActionWithReset } from "@/utils/jotai";

import { createTypedValue, type ScalarValue } from "@/connector/entities";
import {
  activeConfigurationAtom,
  type Edge,
  type EdgeType,
  type Entities,
  type EntityProperties,
  schemaAtom,
  type Vertex,
  type VertexType,
} from "@/core";
import { logger } from "@/utils";
import generatePrefixes from "@/utils/generatePrefixes";

/**
 * Persisted schema state for a database connection.
 *
 * This is the runtime representation of the discovered graph schema, stored in
 * Jotai atoms and persisted to IndexedDB. It gets populated from database
 * schema queries and incrementally updated as users explore the graph.
 */
export type SchemaStorageModel = {
  /** Vertex type configurations with their attributes. */
  vertices: VertexTypeConfig[];
  /** Edge type configurations with their attributes. */
  edges: EdgeTypeConfig[];
  /** RDF namespace prefixes for SPARQL connections. */
  prefixes?: Array<PrefixTypeConfig>;
  /** Edge connections between node labels. */
  edgeConnections?: Array<EdgeConnection>;
  /** When the schema was last updated. */
  lastUpdate?: Date;
  /** Whether a schema sync has been attempted. */
  triedToSync?: boolean;
  /** Whether the last schema sync failed. */
  lastSyncFail?: boolean;
  /** Whether the last edge connection discovery failed. */
  edgeConnectionDiscoveryFailed?: boolean;
  /** Total vertex count from the database. */
  totalVertices?: number;
  /** Total edge count from the database. */
  totalEdges?: number;
};

/** Grabs a specific schema out of the map, or returns the empty schema */
const schemaByIdAtom = atomFamily((id: ConfigurationId | null) => {
  if (!id) {
    return atom(emptySchema);
  }
  return atom(get => {
    logger.debug("Creating active schema", id);
    const schemaMap = get(schemaAtom);
    return schemaMap.get(id) ?? emptySchema;
  });
});

const emptySchema: SchemaStorageModel = {
  vertices: [],
  edges: [],
  prefixes: [],
};

/** Gets the active schema from storage, or undefined if one doesn't exist. */
export const maybeActiveSchemaAtom = atom(get => {
  const id = get(activeConfigurationAtom);
  if (!id) {
    return undefined;
  }

  return get(schemaAtom).get(id);
});

export const activeSchemaAtom = atom(get => {
  const id = get(activeConfigurationAtom);
  return get(schemaByIdAtom(id));
});

/**
 * Hook to check if the active schema has been synchronized from the database.
 *
 * @returns True if the active schema has a lastUpdate timestamp, indicating
 * it has been populated from a database schema query at least once.
 */
export function useHasActiveSchema() {
  const activeSchema = useAtomValue(activeSchemaAtom);
  return !!activeSchema.lastUpdate;
}

/** Gets the stored active schema or a default empty schema */
export function useActiveSchema(): SchemaStorageModel {
  return useDeferredValue(useAtomValue(activeSchemaAtom));
}

/** Gets the stored active schema if one exists for the active connection */
export function useMaybeActiveSchema(): SchemaStorageModel | undefined {
  return useDeferredValue(useAtomValue(maybeActiveSchemaAtom));
}

/** Gets the stored prefixes from the active schema. */
export function usePrefixes(): PrefixTypeConfig[] {
  const schema = useActiveSchema();
  return schema.prefixes ?? [];
}

export const prefixesAtom = atom(get => {
  const schema = get(activeSchemaAtom);
  return schema.prefixes ?? [];
});

function createVertexSchema(vtConfig: VertexTypeConfig) {
  return {
    type: vtConfig.type,
    attributes: vtConfig.attributes.map(attr => ({
      name: attr.name,
      dataType: attr.dataType ?? "String",
    })),
  };
}

export type VertexSchema = Simplify<
  Readonly<ReturnType<typeof createVertexSchema>>
>;

function createEdgeSchema(etConfig: EdgeTypeConfig) {
  return {
    type: etConfig.type,
    attributes: etConfig.attributes.map(attr => ({
      name: attr.name,
      dataType: attr.dataType ?? "String",
    })),
  };
}

export type EdgeSchema = Simplify<
  Readonly<ReturnType<typeof createEdgeSchema>>
>;

function createEdgeConnectionsSchema(edgeConnections: EdgeConnection[]) {
  const all = edgeConnections;

  const byVertexType = new Map<VertexType, EdgeConnection[]>();
  for (const conn of edgeConnections) {
    // Add to source vertex type
    const sourceConns = byVertexType.get(conn.sourceVertexType) ?? [];
    sourceConns.push(conn);
    byVertexType.set(conn.sourceVertexType, sourceConns);

    // Add to target vertex type (if different from source)
    if (conn.targetVertexType !== conn.sourceVertexType) {
      const targetConns = byVertexType.get(conn.targetVertexType) ?? [];
      targetConns.push(conn);
      byVertexType.set(conn.targetVertexType, targetConns);
    }
  }

  return {
    /** All edge connections in the schema */
    all,
    /** Edge connections grouped by vertex type (includes both source and target) */
    byVertexType,
    /** Get all connections for a specific vertex type */
    forVertexType(type: VertexType): EdgeConnection[] {
      return byVertexType.get(type) ?? [];
    },
  };
}

export type EdgeConnectionsSchema = ReturnType<
  typeof createEdgeConnectionsSchema
>;

function createGraphSchema(stored: SchemaStorageModel) {
  logger.debug("Creating graph schema", stored);
  const vertices = new Map<VertexType, VertexSchema>();
  for (const vtConfig of stored.vertices) {
    vertices.set(vtConfig.type, createVertexSchema(vtConfig));
  }

  const edges = new Map<EdgeType, EdgeSchema>();
  for (const etConfig of stored.edges) {
    edges.set(etConfig.type, createEdgeSchema(etConfig));
  }

  const edgeConnections = createEdgeConnectionsSchema(
    stored.edgeConnections ?? [],
  );

  return { vertices, edges, edgeConnections };
}

export function useGraphSchema() {
  const activeSchema = useActiveSchema();
  return createGraphSchema(activeSchema);
}

export function useVertexSchema(type: VertexType) {
  const { vertices } = useGraphSchema();
  return vertices.get(type) ?? { type, attributes: [] };
}

export function useEdgeSchema(type: EdgeType) {
  const { edges } = useGraphSchema();
  return edges.get(type) ?? { type, attributes: [] };
}

export function useVertexTypeTotal(type: VertexType) {
  const schema = useActiveSchema();
  const vertexType = schema.vertices.find(v => v.type === type);
  return vertexType?.total;
}

export function useEdgeTypeTotal(type: EdgeType) {
  const schema = useActiveSchema();
  const edgeType = schema.edges.find(e => e.type === type);
  return edgeType?.total;
}

export const activeSchemaSelector = atom(
  get => {
    const schemaMap = get(schemaAtom);
    const id = get(activeConfigurationAtom);
    const activeSchema = id ? schemaMap.get(id) : null;
    return activeSchema;
  },
  (
    get,
    set,
    update: SetStateActionWithReset<SchemaStorageModel | undefined>,
  ) => {
    const schemaId = get(activeConfigurationAtom);
    if (!schemaId) {
      return;
    }
    set(schemaAtom, prevSchemaMap => {
      const updatedSchemaMap = new Map(prevSchemaMap);
      const prev = updatedSchemaMap.get(schemaId);
      const newValue = typeof update === "function" ? update(prev) : update;

      // Handle reset value or undefined
      if (newValue === RESET || !newValue) {
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      if (newValue === prev) {
        return prevSchemaMap;
      }

      // Update the map
      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  },
);

/** Updates the schema based on the given nodes and edges. */
export function updateSchemaFromEntities(
  entities: Partial<Entities>,
  schema: SchemaStorageModel,
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];

  if (!vertices.length && !edges.length) {
    return schema;
  }

  const newVertexConfigs = vertices.flatMap(mapVertexToTypeConfigs);
  const newEdgeConfigs = edges.map(mapEdgeToTypeConfig);

  const mergedVertices = merge(schema.vertices, newVertexConfigs);
  const mergedEdges = merge(schema.edges, newEdgeConfigs);

  // Only create new schema if something changed
  if (mergedVertices === schema.vertices && mergedEdges === schema.edges) {
    return schema;
  }

  let newSchema = {
    ...schema,
    vertices: mergedVertices,
    edges: mergedEdges,
  } satisfies SchemaStorageModel;

  // Update the generated prefixes in the schema
  newSchema = updateSchemaPrefixes(newSchema);

  logger.debug("Updated schema:", { newSchema, prevSchema: schema });
  return newSchema;
}

/** Merges new node or edge configs in to a set of existing node or edge configs. */
function merge<T extends VertexTypeConfig | EdgeTypeConfig>(
  existing: T[],
  newConfigs: T[],
): T[] {
  const configMap = new Map(existing.map(vt => [vt.type, vt]));
  let hasChanges = false;

  for (const newConfig of newConfigs) {
    const existingConfig = configMap.get(newConfig.type);
    if (!existingConfig) {
      configMap.set(newConfig.type, newConfig);
      hasChanges = true;
    } else {
      const mergedAttributes = mergeAttributes(
        existingConfig.attributes,
        newConfig.attributes,
      );
      if (mergedAttributes === existingConfig.attributes) {
        continue;
      }
      configMap.set(newConfig.type, {
        ...existingConfig,
        attributes: mergedAttributes,
      });
      hasChanges = true;
    }
  }

  // Return original array if nothing changed
  return hasChanges ? Array.from(configMap.values()) : existing;
}

export function mergeAttributes(
  existing: AttributeConfig[],
  newAttributes: AttributeConfig[],
): AttributeConfig[] {
  const attrMap = new Map(existing.map(attr => [attr.name, attr]));
  let hasChanges = false;

  for (const newAttr of newAttributes) {
    const existingAttr = attrMap.get(newAttr.name);
    if (!existingAttr) {
      attrMap.set(newAttr.name, newAttr);
      hasChanges = true;
    } else if (
      existingAttr.name === newAttr.name &&
      existingAttr.dataType !== newAttr.dataType
    ) {
      continue;
    } else {
      // Check if merge would actually change anything
      const merged = { ...existingAttr, ...newAttr };
      if (
        merged.name === existingAttr.name &&
        merged.dataType === existingAttr.dataType
      ) {
        continue;
      }
      attrMap.set(newAttr.name, merged);
      hasChanges = true;
    }
  }

  // Return original array if nothing changed
  return hasChanges ? Array.from(attrMap.values()) : existing;
}

export function mapVertexToTypeConfigs(vertex: Vertex): VertexTypeConfig[] {
  return vertex.types.map(type => ({
    type,
    attributes: Object.entries(vertex.attributes).map(([name, value]) => ({
      name,
      dataType: detectDataType(value),
    })),
  }));
}

export function mapEdgeToTypeConfig(edge: Edge): EdgeTypeConfig {
  return {
    type: edge.type,
    attributes: Object.entries(edge.attributes).map(([name, value]) => ({
      name,
      dataType: detectDataType(value),
    })),
  };
}

function detectDataType(value: ScalarValue) {
  const typedValue = createTypedValue(value);
  switch (typedValue.type) {
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    case "date":
      return "Date";
    case "null":
      return undefined;
  }
}

/** Generate RDF prefixes for all the resource URIs in the schema. */
export function updateSchemaPrefixes(
  schema: SchemaStorageModel,
): SchemaStorageModel {
  const existingPrefixes = schema.prefixes ?? [];

  // Get all the resource URIs from the vertex and edge type configs
  const resourceUris = getResourceUris(schema);

  if (resourceUris.size === 0) {
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

/** A performant way to construct the set of resource URIs from the schema. */
function getResourceUris(schema: SchemaStorageModel) {
  const result = new Set<string>();

  schema.vertices.forEach(v => {
    result.add(v.type);
    v.attributes.forEach(attr => {
      result.add(attr.name);
    });
  });
  schema.edges.forEach(e => {
    result.add(e.type);
  });

  return result;
}

/** Updates the schema with any new vertex or edge types, any new attributes, and updates the generated prefixes for sparql connections. */
export function useUpdateSchemaFromEntities() {
  return useAtomCallback(
    useCallback((get, set, entities: Partial<Entities>) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];
      const activeSchema = get(activeSchemaSelector);
      if (vertices.length === 0 && edges.length === 0) {
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
          return updateSchemaFromEntities(entities, prev);
        });
      });
    }, []),
  );
}

export type UpdateSchemaHandler = ReturnType<
  typeof useUpdateSchemaFromEntities
>;

/** Attempts to efficiently detect if the schema should be updated. */
export function shouldUpdateSchemaFromEntities(
  entities: Partial<Entities>,
  schema: SchemaStorageModel,
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];
  if (vertices.length > 0) {
    // Check if the vertex types and attributes are the same
    const fromEntities = getUniqueTypesAndAttributes(vertices);
    const fromSchema = getUniqueTypesAndAttributes(schema.vertices);

    if (!fromSchema.isSupersetOf(fromEntities)) {
      logger.debug(
        "Found new vertex types or attributes:",
        fromEntities.difference(fromSchema),
      );
      return true;
    }
  }

  if (edges.length > 0) {
    // Check if the edge types and attributes are the same
    const fromEntities = getUniqueTypesAndAttributes(edges);
    const fromSchema = getUniqueTypesAndAttributes(schema.edges);

    if (!fromSchema.isSupersetOf(fromEntities)) {
      logger.debug(
        "Found new edge types or attributes:",
        fromEntities.difference(fromSchema),
      );
      return true;
    }
  }

  return false;
}

/**
 * Creates a set of unique types and attribute names as a set of strings in order to be used for comparisons.
 *
 * The entries in the set will be in the format of `vertexType.attributeName` or `edgeType.attributeName`.
 */
function getUniqueTypesAndAttributes(
  entities: (Vertex | Edge | VertexTypeConfig | EdgeTypeConfig)[],
) {
  return new Set(
    entities.flatMap(e => {
      return [
        e.type,
        ...getAttributeNames(e.attributes).map(a => `${e.type}.${a}`),
      ];
    }),
  );
}

function getAttributeNames(attributes: EntityProperties | AttributeConfig[]) {
  return Array.isArray(attributes)
    ? attributes.map(a => a.name)
    : Object.keys(attributes);
}
