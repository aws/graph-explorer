import { selector, selectorFamily, useRecoilValue } from "recoil";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";
import { mergedConfigurationSelector } from "@/core/StateProvider/configuration";
import type {
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
} from "./types";

function getDefaultVertexTypeConfig(vertexType: string): VertexTypeConfig {
  return {
    color: "#128EE5",
    iconUrl: DEFAULT_ICON_URL,
    iconImageType: "image/svg+xml",
    type: vertexType,
    displayLabel: "",
    attributes: [],
  };
}

function getDefaultEdgeTypeConfig(edgeType: string): EdgeTypeConfig {
  return {
    type: edgeType,
    displayLabel: "",
    attributes: [],
  };
}

export const assembledConfigSelector = selector<
  ConfigurationContextProps | undefined
>({
  key: "assembled-config",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    if (!configuration) {
      return;
    }

    const vertexTypesMap = new Map(
      configuration.schema?.vertices.map(v => [v.type, v])
    );

    const edgeTypesMap = new Map(
      configuration.schema?.edges.map(e => [e.type, e])
    );

    return {
      ...configuration,
      totalVertices: configuration.schema?.totalVertices ?? 0,
      vertexTypes: vertexTypesMap.keys().toArray(),
      totalEdges: configuration.schema?.totalEdges ?? 0,
      edgeTypes: edgeTypesMap.keys().toArray(),
      getVertexTypeConfig(vertexType) {
        return (
          vertexTypesMap.get(vertexType) ??
          getDefaultVertexTypeConfig(vertexType)
        );
      },
      getVertexTypeAttributes(vertexTypes) {
        const attributesByNameMap = new Map(
          vertexTypes
            .values()
            .map(vertexTypesMap.get)
            .filter(vt => vt != null)
            .flatMap(vt => vt.attributes)
            .map(attr => [attr.name, attr])
        );

        return attributesByNameMap.values().toArray();
      },
      getVertexTypeSearchableAttributes(vertexType) {
        const vtConfig = vertexTypesMap.get(vertexType);
        if (!vtConfig) {
          return [];
        }

        return vtConfig.attributes.filter(
          attribute =>
            attribute.searchable !== false && attribute.dataType === "String"
        );
      },
      getEdgeTypeConfig(edgeType) {
        return edgeTypesMap.get(edgeType) ?? getDefaultEdgeTypeConfig(edgeType);
      },
    };
  },
});

const vertexTypeConfigsSelector = selectorFamily({
  key: "vertex-type-configs",
  get:
    (vertexTypes: string[]) =>
    ({ get }) =>
      vertexTypes.map(
        vertexType =>
          get(assembledConfigSelector)?.getVertexTypeConfig(vertexType) ??
          getDefaultVertexTypeConfig(vertexType)
      ),
});

/** Gets the matching vertex type config or a generated default value. */
export function useVertexTypeConfig(vertexType: string) {
  return useRecoilValue(vertexTypeConfigsSelector([vertexType]))[0];
}

/** Gets the matching vertex type configs or the generated default values. */
export function useVertexTypeConfigs(vertexTypes?: string[]) {
  const config = useRecoilValue(assembledConfigSelector);
  const types = vertexTypes ?? config?.vertexTypes ?? [];
  return useRecoilValue(vertexTypeConfigsSelector(types));
}

const edgeTypeConfigsSelector = selectorFamily({
  key: "edge-type-configs",
  get:
    (edgeTypes: string[]) =>
    ({ get }) =>
      edgeTypes.map(
        edgeType =>
          get(assembledConfigSelector)?.getEdgeTypeConfig(edgeType) ??
          getDefaultEdgeTypeConfig(edgeType)
      ),
});

/** Gets the matching edge type config or a generated default value. */
export function useEdgeTypeConfig(edgeType: string) {
  return useRecoilValue(edgeTypeConfigsSelector([edgeType]))[0];
}

/** Gets the matching edge type configs or the generated default values. */
export function useEdgeTypeConfigs(edgeTypes?: string[]) {
  const config = useRecoilValue(assembledConfigSelector);
  const types = edgeTypes ?? config?.edgeTypes ?? [];
  return useRecoilValue(edgeTypeConfigsSelector(types));
}

/** Gets the fully merged and augmented configuration & schema */
export default function useConfiguration() {
  return useRecoilValue(assembledConfigSelector);
}
