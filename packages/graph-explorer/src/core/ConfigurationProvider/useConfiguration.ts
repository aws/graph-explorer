import uniqBy from "lodash/uniqBy";
import { selector, useRecoilValue } from "recoil";
import DEFAULT_ICON_URL from "../../utils/defaultIconUrl";
import { mergedConfigurationSelector } from "../StateProvider/configuration";
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

const assembledConfigSelector = selector<ConfigurationContextProps | undefined>(
  {
    key: "assembled-config",
    get: ({ get }) => {
      const configuration = get(mergedConfigurationSelector);
      if (!configuration) {
        return;
      }

      return {
        ...configuration,
        totalVertices: configuration.schema?.totalVertices ?? 0,
        vertexTypes: configuration.schema?.vertices?.map(vt => vt.type) || [],
        totalEdges: configuration.schema?.totalEdges ?? 0,
        edgeTypes: configuration.schema?.edges?.map(et => et.type) || [],
        getVertexTypeConfig(vertexType) {
          const vtConfig = configuration?.schema?.vertices?.find(
            v => v.type === vertexType
          );
          if (!vtConfig) {
            return getDefaultVertexTypeConfig(vertexType);
          }

          return vtConfig;
        },
        getVertexTypeAttributes(vertexTypes) {
          const vtConfig = configuration?.schema?.vertices?.filter(v =>
            vertexTypes.includes(v.type)
          );

          if (!vtConfig?.length) {
            return [];
          }

          return uniqBy(
            vtConfig.flatMap(v => v.attributes),
            v => v.name
          );
        },
        getVertexTypeSearchableAttributes(vertexType) {
          const vtConfig = configuration?.schema?.vertices?.find(
            v => v.type === vertexType
          );
          if (!vtConfig) {
            return [];
          }

          return vtConfig.attributes.filter(
            attribute =>
              attribute.searchable !== false && attribute.dataType === "String"
          );
        },
        getEdgeTypeConfig(edgeType) {
          const etConfig = configuration?.schema?.edges?.find(
            e => e.type === edgeType
          );
          if (!etConfig) {
            return getDefaultEdgeTypeConfig(edgeType);
          }

          return etConfig;
        },
      };
    },
  }
);

export default function useConfiguration() {
  return useRecoilValue(assembledConfigSelector);
}
