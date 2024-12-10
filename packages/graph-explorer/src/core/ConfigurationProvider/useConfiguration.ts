import { selector, selectorFamily, useRecoilValue } from "recoil";
import {
  allEdgeTypeConfigsSelector,
  allVertexTypeConfigsSelector,
  getDefaultEdgeTypeConfig,
  getDefaultVertexTypeConfig,
  mergedConfigurationSelector,
} from "@/core/StateProvider/configuration";
import type { ConfigurationContextProps } from "./types";

const assembledConfigSelector = selector<ConfigurationContextProps | undefined>(
  {
    key: "assembled-config",
    get: ({ get }) => {
      const configuration = get(mergedConfigurationSelector);
      if (!configuration) {
        return;
      }

      const vertexTypesMap = new Set(
        configuration.schema?.vertices.map(v => v.type)
      );

      const edgeTypesMap = new Set(
        configuration.schema?.edges.map(e => e.type)
      );

      return {
        ...configuration,
        totalVertices: configuration.schema?.totalVertices ?? 0,
        vertexTypes: vertexTypesMap.keys().toArray(),
        totalEdges: configuration.schema?.totalEdges ?? 0,
        edgeTypes: edgeTypesMap.keys().toArray(),
      };
    },
  }
);

export const vertexTypeAttributesSelector = selectorFamily({
  key: "vertex-type-attributes",
  get:
    (vertexTypes: string[]) =>
    ({ get }) => {
      const attributesByNameMap = new Map(
        vertexTypes
          .values()
          .map(vt => get(vertexTypeConfigSelector(vt)))
          .filter(vt => vt != null)
          .flatMap(vt => vt.attributes)
          .map(attr => [attr.name, attr])
      );

      return attributesByNameMap.values().toArray();
    },
});

export const edgeTypeAttributesSelector = selectorFamily({
  key: "edge-type-attributes",
  get:
    (edgeTypes: string[]) =>
    ({ get }) => {
      const attributesByNameMap = new Map(
        edgeTypes
          .values()
          .map(et => get(edgeTypeConfigSelector(et)))
          .filter(et => et != null)
          .flatMap(et => et.attributes)
          .map(attr => [attr.name, attr])
      );

      return attributesByNameMap.values().toArray();
    },
});

export const vertexTypeConfigSelector = selectorFamily({
  key: "vertex-type-config",
  get:
    (vertexType: string) =>
    ({ get }) =>
      get(allVertexTypeConfigsSelector).get(vertexType) ??
      getDefaultVertexTypeConfig(vertexType),
});

/** Gets the matching vertex type config or a generated default value. */
export function useVertexTypeConfig(vertexType: string) {
  return useRecoilValue(vertexTypeConfigSelector(vertexType));
}

const vertexTypeConfigsSelector = selectorFamily({
  key: "vertex-type-configs",
  get:
    (vertexTypes?: string[]) =>
    ({ get }) => {
      const allConfigs = get(allVertexTypeConfigsSelector);
      if (!vertexTypes) {
        return allConfigs.values().toArray();
      }
      return vertexTypes.map(
        type => allConfigs.get(type) ?? getDefaultVertexTypeConfig(type)
      );
    },
});

/** Gets the matching vertex type configs or the generated default values. */
export function useVertexTypeConfigs(vertexTypes?: string[]) {
  return useRecoilValue(vertexTypeConfigsSelector(vertexTypes));
}

export const edgeTypeConfigSelector = selectorFamily({
  key: "edge-type-config",
  get:
    (edgeType: string) =>
    ({ get }) =>
      get(allEdgeTypeConfigsSelector).get(edgeType) ??
      getDefaultEdgeTypeConfig(edgeType),
});

/** Gets the matching edge type config or a generated default value. */
export function useEdgeTypeConfig(edgeType: string) {
  return useRecoilValue(edgeTypeConfigSelector(edgeType));
}

const edgeTypeConfigsSelector = selectorFamily({
  key: "edge-type-configs",
  get:
    (edgeTypes?: string[]) =>
    ({ get }) => {
      const allConfigs = get(allEdgeTypeConfigsSelector);
      if (!edgeTypes) {
        return allConfigs.values().toArray();
      }
      return edgeTypes.map(
        type => allConfigs.get(type) ?? getDefaultEdgeTypeConfig(type)
      );
    },
});

/** Gets the matching edge type configs or the generated default values. */
export function useEdgeTypeConfigs(edgeTypes?: string[]) {
  return useRecoilValue(edgeTypeConfigsSelector(edgeTypes));
}

/** Gets the fully merged and augmented configuration & schema */
export default function useConfiguration() {
  return useRecoilValue(assembledConfigSelector);
}
