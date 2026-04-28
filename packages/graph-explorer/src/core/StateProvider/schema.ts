import type { Simplify } from "type-fest";

import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai-family";
import { RESET, useAtomCallback } from "jotai/utils";
import { useCallback, useDeferredValue } from "react";

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
  createEdgeConnectionId,
  type Edge,
  type EdgeConnectionId,
  type EdgeType,
  type Entities,
  type EntityProperties,
  schemaAtom,
  type Vertex,
  type VertexType,
} from "@/core";
import { logger } from "@/utils";
import { generatePrefixes, PrefixLookup } from "@/utils/rdf";

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
  prefixes?: PrefixTypeConfig[];
  /** Edge connections between node labels. */
  edgeConnections?: EdgeConnection[];
  /** When the schema was last updated. */
  lastUpdate?: Date;
  /** Whether the last schema sync failed. Persisted so the failure survives browser refresh. */
  lastSyncFail?: boolean;
  /** Whether the last edge connection sync failed. Persisted so the failure survives browser refresh. */
  lastEdgeConnectionSyncFail?: boolean;
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
  const activeSchema = useAtomValue(maybeActiveSchemaAtom);
  return !!activeSchema?.lastUpdate;
}

/** Gets the stored active schema or a default empty schema */
export function useActiveSchema(): SchemaStorageModel {
  return useDeferredValue(useAtomValue(activeSchemaAtom));
}

/** Gets the stored active schema if one exists for the active connection */
export function useMaybeActiveSchema(): SchemaStorageModel | undefined {
  return useDeferredValue(useAtomValue(maybeActiveSchemaAtom));
}

/** Gets the stored prefixes from the active schema as a lookup object. */
export function usePrefixes() {
  return useAtomValue(prefixesAtom);
}

export const prefixesAtom = atom(get => {
  const schema = get(activeSchemaAtom);
  const prefixes = schema.prefixes ?? [];
  return PrefixLookup.fromArray(prefixes);
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
  const byVertexType = new Map<VertexType, EdgeConnection[]>();
  const byEdgeConnectionId = new Map<EdgeConnectionId, EdgeConnection>();

  for (const conn of edgeConnections) {
    const id = createEdgeConnectionId(conn);
    byEdgeConnectionId.set(id, conn);

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
    /** Edge connections grouped by vertex type (includes both source and target) */
    byVertexType,
    /** Edge connections by their ID */
    byEdgeConnectionId,
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
      const prev = prevSchemaMap.get(schemaId);
      const newValue = typeof update === "function" ? update(prev) : update;

      if (newValue === prev) {
        return prevSchemaMap;
      }

      const updatedSchemaMap = new Map(prevSchemaMap);

      if (newValue === RESET || !newValue) {
        if (!prev) {
          return prevSchemaMap;
        }
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  },
);

/** Updates the schema based on the given nodes and edges. Preserves referential equality at every level when nothing changes. */
export function updateSchemaFromEntities(
  entities: Partial<Entities>,
  schema: SchemaStorageModel,
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];

  if (!vertices.length && !edges.length) {
    return schema;
  }

  const mergedVertices = mergeVertices(schema.vertices, vertices);
  const mergedEdges = mergeEdges(schema.edges, edges);

  const existingPrefixes = schema.prefixes ?? [];
  const mergedPrefixes = mergePrefixes(
    existingPrefixes,
    entities,
    mergedVertices,
    mergedEdges,
    schema.vertices,
    schema.edges,
  );

  if (
    mergedVertices === schema.vertices &&
    mergedEdges === schema.edges &&
    mergedPrefixes === existingPrefixes
  ) {
    logger.debug("Schema already up to date with given entities");
    return schema;
  }

  const result = {
    ...schema,
    vertices: mergedVertices,
    edges: mergedEdges,
    prefixes:
      mergedPrefixes !== existingPrefixes ? mergedPrefixes : schema.prefixes,
  };

  logger.debug("Updated schema from entities", result);
  return result;
}

/** Merges new vertex entities into existing vertex type configs. */
function mergeVertices(
  existing: VertexTypeConfig[],
  vertices: Vertex[],
): VertexTypeConfig[] {
  if (!vertices.length) {
    return existing;
  }

  const byType = new Map(existing.map(v => [v.type, v]));
  let hasChanges = false;

  for (const vertex of vertices) {
    for (const type of vertex.types) {
      const existingConfig = byType.get(type);
      if (!existingConfig) {
        logger.debug("Discovered new vertex type:", type);
        byType.set(type, {
          type,
          attributes: attributesFromProperties(vertex.attributes),
        });
        hasChanges = true;
      } else {
        const mergedAttrs = mergeAttributesFromProperties(
          existingConfig.attributes,
          vertex.attributes,
        );
        if (mergedAttrs !== existingConfig.attributes) {
          logger.debug("Discovered new attributes for vertex type:", type);
          byType.set(type, { ...existingConfig, attributes: mergedAttrs });
          hasChanges = true;
        }
      }
    }
  }

  return hasChanges ? Array.from(byType.values()) : existing;
}

/** Merges new edge entities into existing edge type configs. */
function mergeEdges(
  existing: EdgeTypeConfig[],
  edges: Edge[],
): EdgeTypeConfig[] {
  if (!edges.length) {
    return existing;
  }

  const byType = new Map(existing.map(e => [e.type, e]));
  let hasChanges = false;

  for (const edge of edges) {
    const existingConfig = byType.get(edge.type);
    if (!existingConfig) {
      logger.debug("Discovered new edge type:", edge.type);
      byType.set(edge.type, {
        type: edge.type,
        attributes: attributesFromProperties(edge.attributes),
      });
      hasChanges = true;
    } else {
      const mergedAttrs = mergeAttributesFromProperties(
        existingConfig.attributes,
        edge.attributes,
      );
      if (mergedAttrs !== existingConfig.attributes) {
        logger.debug("Discovered new attributes for edge type:", edge.type);
        byType.set(edge.type, { ...existingConfig, attributes: mergedAttrs });
        hasChanges = true;
      }
    }
  }

  return hasChanges ? Array.from(byType.values()) : existing;
}

/** Generates and merges new RDF prefixes from entity IRIs and newly-added schema types/attributes. */
function mergePrefixes(
  existing: PrefixTypeConfig[],
  entities: Partial<Entities>,
  mergedVertices: VertexTypeConfig[],
  mergedEdges: EdgeTypeConfig[],
  previousVertices: VertexTypeConfig[],
  previousEdges: EdgeTypeConfig[],
): PrefixTypeConfig[] {
  const iris = new Set<string>();

  for (const v of entities.vertices ?? []) {
    iris.add(String(v.id));
  }
  for (const e of entities.edges ?? []) {
    iris.add(String(e.id));
  }

  // Only scan types/attributes that were actually added or changed
  const previousVertexByType = new Map(previousVertices.map(v => [v.type, v]));
  for (const v of mergedVertices) {
    const prev = previousVertexByType.get(v.type);
    if (!prev) {
      iris.add(v.type);
      for (const attr of v.attributes) {
        iris.add(attr.name);
      }
    } else if (v.attributes !== prev.attributes) {
      for (const attr of v.attributes) {
        iris.add(attr.name);
      }
    }
  }
  const previousEdgeByType = new Map(previousEdges.map(e => [e.type, e]));
  for (const e of mergedEdges) {
    const prev = previousEdgeByType.get(e.type);
    if (!prev) {
      iris.add(e.type);
    }
  }

  const newPrefixes = generateSchemaPrefixes(iris, existing);
  if (newPrefixes.length === 0) {
    return existing;
  }

  logger.debug(
    "Discovered new prefixes:",
    newPrefixes.map(p => p.prefix),
  );
  return [...existing, ...newPrefixes];
}

/** Merges entity properties into an existing attribute list. Preserves existing dataType on conflicts. */
function mergeAttributesFromProperties(
  existing: AttributeConfig[],
  properties: EntityProperties,
): AttributeConfig[] {
  const existingNames = new Set(existing.map(a => a.name));
  const newAttrs: AttributeConfig[] = [];

  for (const name in properties) {
    if (!existingNames.has(name)) {
      newAttrs.push({ name, dataType: detectDataType(properties[name]) });
    }
  }

  if (newAttrs.length === 0) {
    return existing;
  }

  return [...existing, ...newAttrs];
}

/** Converts entity properties to an attribute config array. */
function attributesFromProperties(
  properties: EntityProperties,
): AttributeConfig[] {
  return Object.entries(properties).map(([name, value]) => ({
    name,
    dataType: detectDataType(value),
  }));
}

export function mapVertexToTypeConfigs(vertex: Vertex): VertexTypeConfig[] {
  return vertex.types.map(type => ({
    type,
    attributes: attributesFromProperties(vertex.attributes),
  }));
}

export function mapEdgeToTypeConfig(edge: Edge): EdgeTypeConfig {
  return {
    type: edge.type,
    attributes: attributesFromProperties(edge.attributes),
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

/**
 * Generates new RDF prefixes for IRIs not yet covered by existing prefixes.
 *
 * Returns only the newly generated prefix configs. Returns an empty array when
 * every IRI already has a matching prefix.
 */
export function generateSchemaPrefixes(
  iris: Set<string>,
  existingPrefixes: PrefixTypeConfig[],
): PrefixTypeConfig[] {
  if (iris.size === 0) {
    return [];
  }

  const prefixLookup = PrefixLookup.fromArray(existingPrefixes);
  const newPrefixes = generatePrefixes(iris, prefixLookup);
  if (newPrefixes.length === 0) {
    return [];
  }

  return newPrefixes;
}

/** Collects resource URIs from schema vertex/edge type configs. */
export function getSchemaUris(schema: {
  vertices: VertexTypeConfig[];
  edges: EdgeTypeConfig[];
}) {
  const result = new Set<string>();

  for (const v of schema.vertices) {
    result.add(v.type);
    for (const attr of v.attributes) {
      result.add(attr.name);
    }
  }
  for (const e of schema.edges) {
    result.add(e.type);
  }

  return result;
}

/** Updates the schema with any new vertex or edge types, any new attributes, and updates the generated prefixes for sparql connections. */
export function useUpdateSchemaFromEntities() {
  return useAtomCallback(
    useCallback((_get, set, entities: Partial<Entities>) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];
      if (vertices.length === 0 && edges.length === 0) {
        return;
      }

      set(activeSchemaSelector, prev => {
        if (!prev) {
          return prev;
        }
        return updateSchemaFromEntities(entities, prev);
      });
    }, []),
  );
}

export type UpdateSchemaHandler = ReturnType<
  typeof useUpdateSchemaFromEntities
>;
