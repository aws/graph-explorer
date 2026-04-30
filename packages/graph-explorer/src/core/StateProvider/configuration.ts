import type { ConnectionConfig } from "@shared/types";

import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { isEqual } from "lodash";

import {
  activeConfigurationAtom,
  type AttributeConfig,
  configurationAtom,
  createEdgeType,
  createVertexType,
  type EdgeType,
  type EdgeTypeConfig,
  type RawConfiguration,
  userStylingAtom,
  type VertexType,
  type VertexTypeConfig,
} from "@/core";
import { RESERVED_TYPES_PROPERTY } from "@/utils/constants";

import { activeSchemaSelector, type SchemaStorageModel } from "./schema";
import {
  defaultEdgePreferences,
  defaultVertexPreferences,
  type EdgePreferencesStorageModel,
  type UserStyling,
  type VertexPreferencesStorageModel,
} from "./userPreferences";

/** Gets the currently active config. */
export const activeConfigSelector = atom(get => {
  const configMap = get(configurationAtom);
  const id = get(activeConfigurationAtom);
  const activeConfig = id ? configMap.get(id) : null;
  return activeConfig;
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
  const userStyling = get(userStylingAtom);

  return mergeConfiguration(currentSchema, currentConfig, userStyling);
});

export function mergeConfiguration(
  currentSchema: SchemaStorageModel | null | undefined,
  currentConfig: RawConfiguration,
  userStyling: UserStyling,
): RawConfiguration {
  const configVertexMap = toMapByType(currentConfig.schema?.vertices);
  const schemaVertexMap = toMapByType(currentSchema?.vertices);
  const prefsVertexMap = toMapByType(userStyling.vertices);

  const allVertexLabels = [
    ...new Set([...configVertexMap.keys(), ...schemaVertexMap.keys()]),
  ];
  const mergedVertices = allVertexLabels
    .map(vLabel =>
      mergeVertex(
        configVertexMap.get(vLabel),
        schemaVertexMap.get(vLabel),
        prefsVertexMap.get(vLabel),
      ),
    )
    .toSorted((a, b) => a.type.localeCompare(b.type));

  const configEdgeMap = toMapByType(currentConfig.schema?.edges);
  const schemaEdgeMap = toMapByType(currentSchema?.edges);
  const prefsEdgeMap = toMapByType(userStyling.edges);

  const allEdgeLabels = [
    ...new Set([...configEdgeMap.keys(), ...schemaEdgeMap.keys()]),
  ];
  const mergedEdges = allEdgeLabels.map(eLabel =>
    mergeEdge(
      configEdgeMap.get(eLabel),
      schemaEdgeMap.get(eLabel),
      prefsEdgeMap.get(eLabel),
    ),
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

const mergeAttributes = (
  config: VertexTypeConfig | EdgeTypeConfig | null,
  schema: VertexTypeConfig | EdgeTypeConfig | null,
): AttributeConfig[] => {
  const configAttrMap = new Map(
    config?.attributes.map(attr => [attr.name, attr]),
  );
  const schemaAttrMap = new Map(
    schema?.attributes.map(attr => [attr.name, attr]),
  );
  const allAttrNames = [
    ...new Set([...configAttrMap.keys(), ...schemaAttrMap.keys()]),
  ];

  return allAttrNames.map(attrName => ({
    name: attrName,
    ...(schemaAttrMap.get(attrName) || {}),
    ...(configAttrMap.get(attrName) || {}),
  }));
};

const mergeVertex = (
  configVertex?: VertexTypeConfig,
  schemaVertex?: VertexTypeConfig,
  preferences?: VertexPreferencesStorageModel,
): VertexTypeConfig => {
  // Ignore the displayLabel from schema & config
  const patchedSchema = schemaVertex
    ? patchToRemoveDisplayLabel(schemaVertex)
    : null;
  const patchedConfig = configVertex
    ? patchToRemoveDisplayLabel(configVertex)
    : null;

  const attributes = mergeAttributes(patchedConfig, patchedSchema);

  const vt =
    preferences?.type ||
    configVertex?.type ||
    schemaVertex?.type ||
    createVertexType("unknown");

  return {
    // Defaults
    ...getDefaultVertexTypeConfig(vt),
    // Automatic schema override
    ...(patchedSchema || {}),
    // File-based override
    ...(patchedConfig || {}),
    // User preferences override
    ...(preferences || {}),
    attributes,
  };
};

const mergeEdge = (
  configEdge?: EdgeTypeConfig,
  schemaEdge?: EdgeTypeConfig,
  preferences?: EdgePreferencesStorageModel,
): EdgeTypeConfig => {
  // Ignore the displayLabel from schema & config
  const patchedSchema = schemaEdge
    ? patchToRemoveDisplayLabel(schemaEdge)
    : null;
  const patchedConfig = configEdge
    ? patchToRemoveDisplayLabel(configEdge)
    : null;

  const attributes = mergeAttributes(patchedConfig, patchedSchema);

  const et =
    preferences?.type ||
    configEdge?.type ||
    schemaEdge?.type ||
    createEdgeType("unknown");

  const config: EdgeTypeConfig = {
    // Defaults
    ...getDefaultEdgeTypeConfig(et),
    // Automatic schema override
    ...(patchedSchema || {}),
    // File-based override
    ...(patchedConfig || {}),
    // User preferences override
    ...(preferences || {}),
    attributes,
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
  return new Map(configuration?.schema?.vertices.map(vt => [vt.type, vt]));
});

export const allEdgeTypeConfigsSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return new Map(configuration?.schema?.edges.map(et => [et.type, et]));
});

export const vertexTypesSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return configuration?.schema?.vertices?.map(vt => vt.type) || [];
});

export const edgeTypesSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  return configuration?.schema?.edges?.map(vt => vt.type) || [];
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

function toMapByType<T extends { type: string }>(
  items: T[] | undefined | null,
): Map<string, T> {
  return new Map(items?.map(item => [item.type, item]));
}
