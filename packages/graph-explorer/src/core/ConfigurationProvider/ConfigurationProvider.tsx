import uniqBy from "lodash/uniqBy";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import DEFAULT_ICON_URL from "../../utils/defaultIconUrl";
import EDGE_ICON_URL from "../../utils/edgeIconUrl";
import { mergedConfigurationSelector } from "../StateProvider/configuration";
import type { ConfigurationContextProps } from "./types";


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
  iconImageType:"image/svg+xml",
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

  const getEdgeTypeAttributes: ConfigurationContextProps["getEdgeTypeAttributes"] = useCallback(
    (edgeTypes: string[]) => {
      const etConfig = configuration?.schema?.edges?.filter(v =>
        edgeTypes.includes(v.type)
      );

      if (!etConfig?.length) {
        return [];
      }

      return uniqBy(
        etConfig.flatMap(e => e.attributes),
        e => e.name
      );
    },
    [configuration?.schema?.edges]
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
      getEdgeTypeAttributes,
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
