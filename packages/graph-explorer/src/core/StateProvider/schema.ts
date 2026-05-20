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
  type VertexId,
  type VertexType,
} from "@/core";
import { logger } from "@/utils";
import { generatePrefixes, PrefixLookup } from "@/utils/rdf";

import { nodesAtom, toNodeMap } from "./nodes";

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
  vertexLookup: VertexTypeLookup,
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];

  if (!vertices.length && !edges.length) {
    return schema;
  }

  const { configs: mergedVertices, newIris: vertexIris } = mergeVertices(
    schema.vertices,
    vertices,
  );
  const { configs: mergedEdges, newIris: edgeIris } = mergeEdges(
    schema.edges,
    edges,
  );

  const existingPrefixes = schema.prefixes ?? [];
  const mergedPrefixes = mergePrefixes(
    existingPrefixes,
    entities,
    vertexIris,
    edgeIris,
  );

  const existingConnections = schema.edgeConnections ?? [];
  const mergedConnections = mergeEdgeConnections(
    existingConnections,
    edges,
    vertexLookup,
  );

  if (
    mergedVertices === schema.vertices &&
    mergedEdges === schema.edges &&
    mergedPrefixes === existingPrefixes &&
    mergedConnections === existingConnections
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
    edgeConnections:
      mergedConnections !== existingConnections
        ? mergedConnections
        : schema.edgeConnections,
  };

  logger.debug("Updated schema from entities", result);
  return result;
}

/** Resolves a vertex ID to its type labels without copying vertex data. */
export type VertexTypeLookup = {
  get(id: VertexId): VertexType[] | undefined;
  isEmpty(): boolean;
};

/** Creates a lookup that chains multiple vertex maps, checking each in order. Earlier maps take priority. */
export function createVertexTypeLookup(
  ...sources: ReadonlyMap<VertexId, { types: VertexType[] }>[]
): VertexTypeLookup {
  return {
    get(id) {
      for (const source of sources) {
        const vertex = source.get(id);
        if (vertex) {
          return vertex.types;
        }
      }
      return undefined;
    },
    isEmpty() {
      return sources.every(s => s.size === 0);
    },
  };
}

/** Infers and merges new edge connections from edges and a vertex type lookup. Preserves existing entries including their count. */
function mergeEdgeConnections(
  existing: EdgeConnection[],
  edges: Edge[],
  vertexLookup: VertexTypeLookup,
): EdgeConnection[] {
  // Fast-path: skip work when there are no edges or no vertices to resolve against
  if (edges.length === 0 || vertexLookup.isEmpty()) {
    return existing;
  }

  const existingIds = new Set(existing.map(createEdgeConnectionId));
  const newConnections: EdgeConnection[] = [];

  for (const edge of edges) {
    const sourceTypes = vertexLookup.get(edge.sourceId);
    const targetTypes = vertexLookup.get(edge.targetId);
    if (!sourceTypes || !targetTypes) {
      continue;
    }

    for (const sourceVertexType of sourceTypes) {
      for (const targetVertexType of targetTypes) {
        const connection: EdgeConnection = {
          sourceVertexType,
          edgeType: edge.type,
          targetVertexType,
        };
        const id = createEdgeConnectionId(connection);
        if (!existingIds.has(id)) {
          existingIds.add(id);
          newConnections.push(connection);
        }
      }
    }
  }

  if (newConnections.length === 0) {
    return existing;
  }

  return [...existing, ...newConnections];
}

type MergeResult<T> = {
  configs: T[];
  newIris: Set<string>;
};

/** Merges new vertex entities into existing vertex type configs. */
function mergeVertices(
  existing: VertexTypeConfig[],
  vertices: Vertex[],
): MergeResult<VertexTypeConfig> {
  if (!vertices.length) {
    return { configs: existing, newIris: new Set() };
  }

  const byType = new Map(existing.map(v => [v.type, v]));
  const newIris = new Set<string>();
  let hasChanges = false;

  for (const vertex of vertices) {
    const attrs = attributesFromProperties(vertex.attributes);
    for (const type of vertex.types) {
      const existingConfig = byType.get(type);
      if (!existingConfig) {
        logger.debug("Discovered new vertex type:", type);
        byType.set(type, { type, attributes: attrs });
        newIris.add(type);
        for (const attr of attrs) {
          newIris.add(attr.name);
        }
        hasChanges = true;
      } else {
        const mergedAttrs = mergeAttributesFromProperties(
          existingConfig.attributes,
          vertex.attributes,
        );
        if (mergedAttrs !== existingConfig.attributes) {
          logger.debug("Discovered new attributes for vertex type:", type);
          byType.set(type, { ...existingConfig, attributes: mergedAttrs });
          // Only the newly added attributes need IRI scanning
          for (
            let i = existingConfig.attributes.length;
            i < mergedAttrs.length;
            i++
          ) {
            newIris.add(mergedAttrs[i].name);
          }
          hasChanges = true;
        }
      }
    }
  }

  return {
    configs: hasChanges ? Array.from(byType.values()) : existing,
    newIris,
  };
}

/** Merges new edge entities into existing edge type configs. */
function mergeEdges(
  existing: EdgeTypeConfig[],
  edges: Edge[],
): MergeResult<EdgeTypeConfig> {
  if (!edges.length) {
    return { configs: existing, newIris: new Set() };
  }

  const byType = new Map(existing.map(e => [e.type, e]));
  const newIris = new Set<string>();
  let hasChanges = false;

  for (const edge of edges) {
    const existingConfig = byType.get(edge.type);
    if (!existingConfig) {
      logger.debug("Discovered new edge type:", edge.type);
      byType.set(edge.type, {
        type: edge.type,
        attributes: attributesFromProperties(edge.attributes),
      });
      newIris.add(edge.type);
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

  return {
    configs: hasChanges ? Array.from(byType.values()) : existing,
    newIris,
  };
}

/** Generates and merges new RDF prefixes from entity IRIs and newly-discovered schema IRIs. */
function mergePrefixes(
  existing: PrefixTypeConfig[],
  entities: Partial<Entities>,
  vertexIris: Set<string>,
  edgeIris: Set<string>,
): PrefixTypeConfig[] {
  const iris = new Set<string>(vertexIris);

  for (const iri of edgeIris) {
    iris.add(iri);
  }
  for (const v of entities.vertices ?? []) {
    iris.add(String(v.id));
  }
  for (const e of entities.edges ?? []) {
    iris.add(String(e.id));
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

  for (const name of Object.keys(properties)) {
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
    useCallback((get, set, entities: Partial<Entities>) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];
      if (vertices.length === 0 && edges.length === 0) {
        return;
      }

      // Incoming entities take priority over canvas vertices
      const vertexLookup = createVertexTypeLookup(
        toNodeMap(vertices),
        get(nodesAtom),
      );

      set(activeSchemaSelector, prev => {
        if (!prev) {
          return prev;
        }
        return updateSchemaFromEntities(entities, prev, vertexLookup);
      });
    }, []),
  );
}

export type UpdateSchemaHandler = ReturnType<
  typeof useUpdateSchemaFromEntities
>;
