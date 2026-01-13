import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai-family";

import {
  allEdgeTypeConfigsSelector,
  allVertexTypeConfigsSelector,
  getDefaultEdgeTypeConfig,
  getDefaultVertexTypeConfig,
  mergedConfigurationSelector,
} from "@/core/StateProvider/configuration";

import type { EdgeType, VertexType } from "../entities";
import type { ConfigurationContextProps } from "./types";

const assembledConfigSelector = atom(get => {
  const configuration = get(mergedConfigurationSelector);
  if (!configuration) {
    return;
  }

  const vertexTypesMap = new Set(
    configuration.schema?.vertices.map(v => v.type),
  );

  const edgeTypesMap = new Set(configuration.schema?.edges.map(e => e.type));

  const result: ConfigurationContextProps = {
    ...configuration,
    totalVertices: configuration.schema?.totalVertices ?? 0,
    vertexTypes: vertexTypesMap.keys().toArray(),
    totalEdges: configuration.schema?.totalEdges ?? 0,
    edgeTypes: edgeTypesMap.keys().toArray(),
  };
  return result;
});

export const vertexTypeConfigSelector = atomFamily((vertexType: VertexType) =>
  atom(
    get =>
      get(allVertexTypeConfigsSelector).get(vertexType) ??
      getDefaultVertexTypeConfig(vertexType),
  ),
);

/** Gets the matching vertex type config or a generated default value. */
export function useVertexTypeConfig(vertexType: VertexType) {
  return useAtomValue(vertexTypeConfigSelector(vertexType));
}

const vertexTypeConfigsSelector = atomFamily((vertexTypes?: VertexType[]) =>
  atom(get => {
    const allConfigs = get(allVertexTypeConfigsSelector);
    if (!vertexTypes) {
      return allConfigs.values().toArray();
    }
    return vertexTypes.map(
      type => allConfigs.get(type) ?? getDefaultVertexTypeConfig(type),
    );
  }),
);

/** Gets the matching vertex type configs or the generated default values. */
export function useVertexTypeConfigs(vertexTypes?: VertexType[]) {
  return useAtomValue(vertexTypeConfigsSelector(vertexTypes));
}

export const edgeTypeConfigSelector = atomFamily((edgeType: EdgeType) =>
  atom(
    get =>
      get(allEdgeTypeConfigsSelector).get(edgeType) ??
      getDefaultEdgeTypeConfig(edgeType),
  ),
);

/** Gets the matching edge type config or a generated default value. */
export function useEdgeTypeConfig(edgeType: EdgeType) {
  return useAtomValue(edgeTypeConfigSelector(edgeType));
}

const edgeTypeConfigsSelector = atomFamily((edgeTypes?: EdgeType[]) =>
  atom(get => {
    const allConfigs = get(allEdgeTypeConfigsSelector);
    if (!edgeTypes) {
      return allConfigs.values().toArray();
    }
    return edgeTypes.map(
      type => allConfigs.get(type) ?? getDefaultEdgeTypeConfig(type),
    );
  }),
);

/** Gets the matching edge type configs or the generated default values. */
export function useEdgeTypeConfigs(edgeTypes?: EdgeType[]) {
  return useAtomValue(edgeTypeConfigsSelector(edgeTypes));
}

/** Gets the fully merged and augmented configuration & schema */
export default function useConfiguration() {
  return useAtomValue(assembledConfigSelector);
}

/** Gets the fully merged and augmented configuration & schema, and throws if no active configuration. */
export function useResolvedConfig() {
  const config = useConfiguration();
  if (!config) {
    throw new Error("Must have an active configuration");
  }
  return config;
}
