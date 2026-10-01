import type { RawConfiguration } from "@/connections";
import type {
  EdgeStyleStorage,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import type { SchemaStorageModel } from "../StateProvider";

import {
  createEdgeType,
  createVertexType,
  type EdgeType,
  type VertexType,
} from "../entities";

export type AttributeConfig = {
  /**
   * Name of the attribute in the DB schema
   */
  name: string;

  /**
   * DB data type
   */
  dataType?: string;
};

export type VertexTypeConfig = {
  /**
   * Vertex type name's in the DB schema
   */
  type: VertexType;
  /**
   * Name to be printed
   */
  displayLabel?: string;
  /**
   * Optional icon to be rendered inside the graph viewer and
   * other modules.
   */
  iconUrl?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
  /**
   * List of attributes for the vertex type
   */
  attributes: Array<AttributeConfig>;
  /**
   * Total number of vertices of this type
   */
  total?: number;
} & VertexStyleStorage;

export type EdgeTypeConfig = {
  /**
   * Edge type name's in the DB schema
   */
  type: EdgeType;
  /**
   * Name to be printed
   */
  displayLabel?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * List of attributes for the edge type
   */
  attributes: Array<AttributeConfig>;
  /**
   * Total number of edges of this type
   */
  total?: number;
} & EdgeStyleStorage;

export type PrefixTypeConfig = {
  prefix: RdfPrefix;
  /**
   * Full URI for the prefix
   */
  uri: IriNamespace;
  /**
   * Internal purpose only.
   * Mark as true after inferring from the schema.
   */
  __inferred?: boolean;
};

/** Creates a PrefixTypeConfig from plain strings. */
export function createPrefixTypeConfig(options: {
  prefix: string;
  uri: string;
  inferred?: boolean;
}): PrefixTypeConfig {
  return {
    prefix: options.prefix as RdfPrefix,
    uri: options.uri as IriNamespace,
    __inferred: options.inferred,
  };
}

/**
 * Represents a connection between node labels via an edge type.
 * Used by Schema Explorer to visualize relationships between node types.
 */
export type EdgeConnection = {
  /**
   * The edge type name
   */
  edgeType: EdgeType;
  /**
   * The source node label
   */
  sourceVertexType: VertexType;
  /**
   * The target node label
   */
  targetVertexType: VertexType;
  /**
   * Count of edges with this connection pattern
   */
  count?: number;
};

/** Creates an EdgeConnection with branded types from plain strings. */
export function createEdgeConnection(options: {
  source: string;
  edge: string;
  target: string;
  count?: number;
}): EdgeConnection {
  return {
    sourceVertexType: createVertexType(options.source),
    edgeType: createEdgeType(options.edge),
    targetVertexType: createVertexType(options.target),
    ...(options.count != null && { count: options.count }),
  };
}

/**
 * A configuration assembled in memory by merging the stored
 * {@link RawConfiguration} with its active schema and user styling. Unlike the
 * persisted {@link RawConfiguration}, this carries the schema inline for the UI
 * to consume.
 */
export type MergedConfiguration = RawConfiguration & {
  /**
   * Database schema: types, names, labels, icons, ...
   *
   * Always present — `mergeConfiguration` builds it from the active schema and
   * user styling, defaulting to empty type lists when there is no schema yet.
   */
  schema: SchemaStorageModel;
};

export type ConfigurationContextProps = MergedConfiguration & {
  totalVertices: number;
  vertexTypes: Array<VertexType>;
  totalEdges: number;
  edgeTypes: Array<EdgeType>;
};
