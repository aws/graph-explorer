import uniqBy from "lodash/uniqBy";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import DEFAULT_ICON_URL from "../../utils/defaultIconUrl";
import { mergedConfigurationSelector } from "../StateProvider/configuration";
import type { ConfigurationContextProps } from "./types";
import EDGE_ICON_URL from "../../utils/edgeIconUrl";

export const ConfigurationContext = createContext<
  ConfigurationContextProps | undefined
>(undefined);

export type ConfigurationProviderProps = unknown;

const getDefaultVertexTypeConfig = (vertexType: string) => ({
  color: "#128EE5",
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  type: vertexType,
  displayLabel: "",
  attributes: [],
});


const getDefaultEdgeTypeConfig = (edgeType: string) => ({
  color: "#128EE5",
  iconUrl: EDGE_ICON_URL,
  type: edgeType,
  displayLabel: "",
  attributes: [],
});

const ConfigurationProvider = ({
  children,
}: PropsWithChildren<ConfigurationProviderProps>) => {
  const configuration = useRecoilValue(mergedConfigurationSelector);

  const getVertexTypeConfig: ConfigurationContextProps["getVertexTypeConfig"] = useCallback(
    vertexType => {
      const vtConfig = configuration?.schema?.vertices?.find(
        v => v.type === vertexType
      );
      if (!vtConfig) {
        return getDefaultVertexTypeConfig(vertexType);
      }

      return vtConfig;
    },
    [configuration?.schema?.vertices]
  );

  const getVertexTypeAttributes: ConfigurationContextProps["getVertexTypeAttributes"] = useCallback(
    (vertexTypes: string[]) => {
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
    [configuration?.schema?.vertices]
  );

  const getVertexTypeSearchableAttributes: ConfigurationContextProps["getVertexTypeSearchableAttributes"] = useCallback(
    (vertexType: string) => {
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
    [configuration?.schema?.vertices]
  );

  const getEdgeTypeSearchableAttributes: ConfigurationContextProps["getEdgeTypeSearchableAttributes"] = useCallback(
    (edgeType: string) => {
      const etConfig = configuration?.schema?.edges?.find(
        e => e.type === edgeType
      );
      if (!etConfig) {
        return [];
      }

      return etConfig.attributes.filter(
        attribute =>
          attribute.searchable !== false && attribute.dataType === "String"
      );
    },
    [configuration?.schema?.edges]
  );

  const getEdgeTypeConfig: ConfigurationContextProps["getEdgeTypeConfig"] = useCallback(
    (edgeType: string) => {
      const etConfig = configuration?.schema?.edges?.find(
        e => e.type === edgeType
      );
      if (!etConfig) {
        return getDefaultEdgeTypeConfig(edgeType);
      }

      return etConfig;
    },
    [configuration?.schema?.edges]
  );

  const value: ConfigurationContextProps | undefined = useMemo(() => {
    if (!configuration) {
      return;
    }

    return {
      ...(configuration || {}),
      totalVertices: configuration.schema?.totalVertices ?? 0,
      vertexTypes: configuration.schema?.vertices?.map(vt => vt.type) || [],
      totalEdges: configuration.schema?.totalEdges ?? 0,
      edgeTypes: configuration.schema?.edges?.map(et => et.type) || [],
      getVertexTypeConfig,
      getVertexTypeAttributes,
      getVertexTypeSearchableAttributes,
      getEdgeTypeSearchableAttributes,
      getEdgeTypeConfig,
    };
  }, [
    configuration,
    getVertexTypeConfig,
    getVertexTypeAttributes,
    getVertexTypeSearchableAttributes,
    getEdgeTypeSearchableAttributes,
    getEdgeTypeConfig,
  ]);

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

export default ConfigurationProvider;
