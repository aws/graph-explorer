import { atom } from "jotai";

import type { SavedConnection } from "@/connections";

import {
  activeSavedConnectionSelector,
  normalizeConnection,
} from "@/connections";
import { RESERVED_TYPES_PROPERTY } from "@/utils/constants";

import type { EdgeType, VertexType } from "../entities";
import type {
  AttributeConfig,
  EdgeTypeConfig,
  MergedConfiguration,
  VertexTypeConfig,
} from "./typeConfigTypes";

import {
  appDefaultEdgeStyle,
  appDefaultVertexStyle,
  type EdgeStyleStorage,
  type VertexStyleStorage,
} from "./graphStyles";
import { activeSchemaSelector, type SchemaStorageModel } from "./schema";
import { userEdgeStylesAtom, userVertexStylesAtom } from "./storageAtoms";

export const mergedConfigurationSelector = atom(get => {
  const currentConnection = get(activeSavedConnectionSelector);
  if (!currentConnection) {
    return null;
  }

  const currentSchema = get(activeSchemaSelector);
  const vertexStyles = get(userVertexStylesAtom);
  const edgeStyles = get(userEdgeStylesAtom);

  return mergeConfiguration(
    currentSchema,
    currentConnection,
    vertexStyles,
    edgeStyles,
  );
});

export function mergeConfiguration(
  currentSchema: SchemaStorageModel | null | undefined,
  currentConnection: SavedConnection,
  vertexStyles: ReadonlyMap<VertexType, VertexStyleStorage>,
  edgeStyles: ReadonlyMap<EdgeType, EdgeStyleStorage>,
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
    id: currentConnection.id,
    displayLabel: currentConnection.displayLabel,
    connection: normalizeConnection(
      currentConnection.connection || { graphDbUrl: "" },
    ),
    schema: {
      vertices: mergedVertices,
      edges: mergedEdges,
      lastUpdate: currentSchema?.lastUpdate,
      prefixes:
        currentConnection.connection?.queryEngine === "sparql"
          ? currentSchema?.prefixes
          : undefined,
      lastSyncFail: currentSchema?.lastSyncFail,
      totalVertices: currentSchema?.totalVertices ?? 0,
      totalEdges: currentSchema?.totalEdges ?? 0,
      edgeConnections: currentSchema?.edgeConnections,
    },
  };
}

const mergeVertex = (
  schemaVertex: VertexTypeConfig,
  style?: VertexStyleStorage,
): VertexTypeConfig => {
  // Ignore the displayLabel from the schema
  const patchedSchema = patchToRemoveDisplayLabel(schemaVertex);

  return {
    // Defaults
    ...getDefaultVertexTypeConfig(schemaVertex.type),
    // Automatic schema override
    ...patchedSchema,
    // User style override
    ...style,
  };
};

const mergeEdge = (
  schemaEdge: EdgeTypeConfig,
  style?: EdgeStyleStorage,
): EdgeTypeConfig => {
  // Ignore the displayLabel from the schema
  const patchedSchema = patchToRemoveDisplayLabel(schemaEdge);

  const config: EdgeTypeConfig = {
    // Defaults
    ...getDefaultEdgeTypeConfig(schemaEdge.type),
    // Automatic schema override
    ...patchedSchema,
    // User style override
    ...style,
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
  ...appDefaultVertexStyle,
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
  ...appDefaultEdgeStyle,
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
