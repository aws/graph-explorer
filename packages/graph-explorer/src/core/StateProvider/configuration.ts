import type { ConnectionConfig } from "@shared/types";

import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { isEqual } from "lodash";

import {
  activeConfigurationAtom,
  type AttributeConfig,
  configurationAtom,
  userEdgeStylesAtom,
  type EdgeType,
  type EdgeTypeConfig,
  type MergedConfiguration,
  type RawConfiguration,
  type VertexType,
  type VertexTypeConfig,
  userVertexStylesAtom,
} from "@/core";
import { RESERVED_TYPES_PROPERTY } from "@/utils/constants";

import { activeSchemaSelector, type SchemaStorageModel } from "./schema";
import {
  defaultEdgePreferences,
  defaultVertexPreferences,
  type EdgePreferencesStorageModel,
  type VertexPreferencesStorageModel,
} from "./userPreferences";

/** Gets the currently active config. */
export const activeConfigSelector = atom(get => {
  const configMap = get(configurationAtom);
  const id = get(activeConfigurationAtom);
  // The id may point at a connection deleted in another tab, so a map miss
  // resolves to null (no active connection) rather than a dangling pointer.
  return (id && configMap.get(id)) ?? null;
});

export const activeConnectionAtom = atom(get => {
  const connection = get(
    selectAtom(activeConfigSelector, c => c?.connection, isEqual),
  );
  if (!connection) {
    return null;
  }
  return normalizeConnection(connection);
});

export const mergedConfigurationSelector = atom(get => {
  const currentConfig = get(activeConfigSelector);
  if (!currentConfig) {
    return null;
  }

  const currentSchema = get(activeSchemaSelector);
  const vertexStyles = get(userVertexStylesAtom);
  const edgeStyles = get(userEdgeStylesAtom);

  return mergeConfiguration(
    currentSchema,
    currentConfig,
    vertexStyles,
    edgeStyles,
  );
});

export function mergeConfiguration(
  currentSchema: SchemaStorageModel | null | undefined,
  currentConfig: RawConfiguration,
  vertexStyles: ReadonlyMap<VertexType, VertexPreferencesStorageModel>,
  edgeStyles: ReadonlyMap<EdgeType, EdgePreferencesStorageModel>,
): MergedConfiguration {
  const mergedVertices = (currentSchema?.vertices ?? [])
    .map(schemaVertex =>
      mergeVertex(schemaVertex, vertexStyles.get(schemaVertex.type)),
    )
    .toSorted((a, b) => a.type.localeCompare(b.type));

  const mergedEdges = (currentSchema?.edges ?? []).map(schemaEdge =>
    mergeEdge(schemaEdge, edgeStyles.get(schemaEdge.type)),
  );

  return {
    id: currentConfig.id,
    displayLabel: currentConfig.displayLabel,
    connection: normalizeConnection(currentConfig.connection || { url: "" }),
    schema: {
      vertices: mergedVertices,
      edges: mergedEdges,
      lastUpdate: currentSchema?.lastUpdate,
      prefixes:
        currentConfig.connection?.queryEngine === "sparql"
          ? currentSchema?.prefixes
          : undefined,
      lastSyncFail: currentSchema?.lastSyncFail,
      totalVertices: currentSchema?.totalVertices ?? 0,
      totalEdges: currentSchema?.totalEdges ?? 0,
      edgeConnections: currentSchema?.edgeConnections,
    },
  };
}

export function normalizeConnection(connection: ConnectionConfig) {
  return {
    ...connection,
    // Remove trailing slash
    url: connection.url.replace(/\/$/, "") || "",
    queryEngine: connection.queryEngine || "gremlin",
    graphDbUrl: connection.graphDbUrl?.replace(/\/$/, "") || "",
    proxyConnection:
      connection.proxyConnection ?? connection.graphDbUrl != null,
    awsAuthEnabled: connection.awsAuthEnabled ?? false,
  };
}
export type NormalizedConnection = ReturnType<typeof normalizeConnection>;

const mergeVertex = (
  schemaVertex: VertexTypeConfig,
  preferences?: VertexPreferencesStorageModel,
): VertexTypeConfig => {
  // Ignore the displayLabel from the schema
  const patchedSchema = patchToRemoveDisplayLabel(schemaVertex);

  return {
    // Defaults
    ...getDefaultVertexTypeConfig(schemaVertex.type),
    // Automatic schema override
    ...patchedSchema,
    // User preferences override
    ...preferences,
  };
};

const mergeEdge = (
  schemaEdge: EdgeTypeConfig,
  preferences?: EdgePreferencesStorageModel,
): EdgeTypeConfig => {
  // Ignore the displayLabel from the schema
  const patchedSchema = patchToRemoveDisplayLabel(schemaEdge);

  const config: EdgeTypeConfig = {
    // Defaults
    ...getDefaultEdgeTypeConfig(schemaEdge.type),
    // Automatic schema override
    ...patchedSchema,
    // User preferences override
    ...preferences,
  };

  if (config.displayNameAttribute === "type") {
    // Patch displayNameAttribute to be "types" when it was "type" ensuring
    // backwards compatibility if the user had customized the
    // displayNameAttribute to be the edge type prior to this release.
    config.displayNameAttribute = RESERVED_TYPES_PROPERTY;
  }

  return config;
};

export const allVertexTypeConfigsSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return new Map(configuration?.schema.vertices.map(vt => [vt.type, vt]));
});

export const allEdgeTypeConfigsSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return new Map(configuration?.schema.edges.map(et => [et.type, et]));
});

export const vertexTypesSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return configuration?.schema.vertices.map(vt => vt.type) || [];
});

export const edgeTypesSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return configuration?.schema.edges.map(vt => vt.type) || [];
});

export const defaultVertexTypeConfig = {
  attributes: [],
  ...defaultVertexPreferences,
} satisfies Omit<VertexTypeConfig, "type">;

export function getDefaultVertexTypeConfig(
  vertexType: VertexType,
): VertexTypeConfig {
  return {
    ...defaultVertexTypeConfig,
    type: vertexType,
  };
}

export const defaultEdgeTypeConfig = {
  attributes: [],
  ...defaultEdgePreferences,
} satisfies Omit<EdgeTypeConfig, "type">;

export function getDefaultEdgeTypeConfig(edgeType: EdgeType): EdgeTypeConfig {
  return {
    ...defaultEdgeTypeConfig,
    type: edgeType,
  };
}

/**
 * Removes the displayLabel property from a vertex or edge config and any
 * attributes.
 *
 * This is to ensure cached schema values that have been persisted do not impact
 * displayLabel behavior going forward.
 * @param config The config without any displayLabel values
 */
export function patchToRemoveDisplayLabel<
  TypeConfig extends VertexTypeConfig | EdgeTypeConfig,
>(config: TypeConfig): TypeConfig {
  const { displayLabel: _, ...rest } = config;

  return {
    ...rest,
    // Remove any displayLabel values that were cached in old versions of Graph Explorer
    attributes: config.attributes.map(attr => {
      const { displayLabel: _, ...attrRest } = attr as AttributeConfig & {
        displayLabel?: string;
      };
      return attrRest;
    }),
  } as TypeConfig;
}
