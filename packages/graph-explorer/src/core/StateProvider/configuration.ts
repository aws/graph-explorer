import { uniq } from "lodash";
import { atom, selector } from "recoil";
import { sanitizeText } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";
import type {
  AttributeConfig,
  EdgeTypeConfig,
  RawConfiguration,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { activeSchemaSelector, SchemaInference } from "./schema";
import {
  EdgePreferences,
  UserStyling,
  userStylingAtom,
  VertexPreferences,
} from "./userPreferences";
import isDefaultValue from "./isDefaultValue";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";

export const isStoreLoadedAtom = atom<boolean>({
  key: "store-loaded",
  default: false,
});

export const activeConfigurationAtom = atom<string | null>({
  key: "active-configuration",
  default: null,
  effects: [localForageEffect()],
});

export const configurationAtom = atom<Map<string, RawConfiguration>>({
  key: "configuration",
  default: new Map(),
  effects: [localForageEffect()],
});

/** Gets or sets the config that is currently active. */
export const activeConfigSelector = selector({
  key: "active-config-selector",
  get({ get }) {
    const configMap = get(configurationAtom);
    const id = get(activeConfigurationAtom);
    const activeConfig = id ? configMap.get(id) : null;
    return activeConfig;
  },
  set({ get, set }, newValue) {
    const configId = get(activeConfigurationAtom);
    if (!configId) {
      return;
    }
    set(configurationAtom, prevConfigMap => {
      const updatedConfigMap = new Map(prevConfigMap);

      // Handle reset value
      if (!newValue || isDefaultValue(newValue)) {
        updatedConfigMap.delete(configId);
        return updatedConfigMap;
      }

      // Update the map
      updatedConfigMap.set(configId, newValue);

      return updatedConfigMap;
    });
  },
});

export const mergedConfigurationSelector = selector<RawConfiguration | null>({
  key: "merged-configuration",
  get: ({ get }) => {
    const currentConfig = get(activeConfigSelector);
    if (!currentConfig) {
      return null;
    }

    const currentSchema = get(activeSchemaSelector);
    const userStyling = get(userStylingAtom);

    return mergeConfiguration(currentSchema, currentConfig, userStyling);
  },
});

export function mergeConfiguration(
  currentSchema: SchemaInference | null | undefined,
  currentConfig: RawConfiguration,
  userStyling: UserStyling
): RawConfiguration {
  const configVLabels = currentConfig.schema?.vertices.map(v => v.type) || [];
  const schemaVLabels = currentSchema?.vertices?.map(v => v.type) || [];
  const allVertexLabels = uniq([...configVLabels, ...schemaVLabels]);
  const mergedVertices = allVertexLabels
    .map(vLabel => {
      const configVertex = currentConfig.schema?.vertices.find(
        v => v.type === vLabel
      );
      const schemaVertex = currentSchema?.vertices.find(v => v.type === vLabel);
      const prefsVertex = userStyling.vertices?.find(v => v.type === vLabel);

      return mergeVertex(configVertex, schemaVertex, prefsVertex);
    })
    .toSorted((a, b) => a.type.localeCompare(b.type));

  const configELabels = currentConfig.schema?.edges.map(v => v.type) || [];
  const schemaELabels = currentSchema?.edges?.map(v => v.type) || [];
  const allEdgeLabels = uniq([...configELabels, ...schemaELabels]);
  const mergedEdges = allEdgeLabels.map(vLabel => {
    const configEdge = currentConfig.schema?.edges.find(v => v.type === vLabel);
    const schemaEdge = currentSchema?.edges.find(v => v.type === vLabel);
    const prefsEdge = userStyling.edges?.find(v => v.type === vLabel);
    return mergeEdge(configEdge, schemaEdge, prefsEdge);
  });

  return {
    id: currentConfig.id,
    displayLabel: currentConfig.displayLabel,
    remoteConfigFile: currentConfig.remoteConfigFile,
    __fileBase: currentConfig.__fileBase,
    connection: {
      ...(currentConfig.connection || {}),
      // Remove trailing slash
      url: currentConfig.connection?.url?.replace(/\/$/, "") || "",
      queryEngine: currentConfig.connection?.queryEngine || "gremlin",
      graphDbUrl:
        currentConfig.connection?.graphDbUrl?.replace(/\/$/, "") || "",
    },
    schema: {
      vertices: mergedVertices,
      edges: mergedEdges,
      lastUpdate: currentSchema?.lastUpdate,
      prefixes:
        currentConfig.connection?.queryEngine === "sparql"
          ? currentSchema?.prefixes
          : undefined,
      triedToSync: currentSchema?.triedToSync,
      lastSyncFail: currentSchema?.lastSyncFail,
      totalVertices: currentSchema?.totalVertices ?? 0,
      totalEdges: currentSchema?.totalEdges ?? 0,
    },
  };
}

const mergeAttributes = (
  config?: VertexTypeConfig | EdgeTypeConfig,
  schema?: VertexTypeConfig | EdgeTypeConfig
): AttributeConfig[] => {
  const configAttrLabels = config?.attributes.map(attr => attr.name) || [];
  const schemaAttrLabels = schema?.attributes.map(attr => attr.name) || [];
  const allAttrLabels = uniq([...configAttrLabels, ...schemaAttrLabels]);

  return allAttrLabels.map(attrName => {
    const configAttr = config?.attributes.find(attr => attr.name === attrName);
    const schemaAttr = schema?.attributes.find(attr => attr.name === attrName);

    return {
      name: attrName,
      displayLabel: sanitizeText(attrName),
      ...(schemaAttr || {}),
      ...(configAttr || {}),
    };
  });
};

const mergeVertex = (
  configVertex?: VertexTypeConfig,
  schemaVertex?: VertexTypeConfig,
  preferences?: VertexPreferences
): VertexTypeConfig => {
  const attributes = mergeAttributes(configVertex, schemaVertex);

  const vt =
    preferences?.type || configVertex?.type || schemaVertex?.type || "unknown";

  return {
    // Defaults
    ...getDefaultVertexTypeConfig(vt),
    // Automatic schema override
    ...(schemaVertex || {}),
    // File-based override
    ...(configVertex || {}),
    // User preferences override
    ...(preferences || {}),
    attributes,
  };
};

const mergeEdge = (
  configEdge?: EdgeTypeConfig,
  schemaEdge?: EdgeTypeConfig,
  preferences?: EdgePreferences
): EdgeTypeConfig => {
  const attributes = mergeAttributes(configEdge, schemaEdge);

  const et =
    preferences?.type || configEdge?.type || schemaEdge?.type || "unknown";

  return {
    // Defaults
    ...getDefaultEdgeTypeConfig(et),
    // Automatic schema override
    ...(schemaEdge || {}),
    // File-based override
    ...(configEdge || {}),
    // User preferences override
    ...(preferences || {}),
    attributes,
  };
};

export const allVertexTypeConfigsSelector = selector({
  key: "all-vertex-type-configs",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    return new Map(configuration?.schema?.vertices.map(vt => [vt.type, vt]));
  },
});

export const allEdgeTypeConfigsSelector = selector({
  key: "all-edge-type-configs",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    return new Map(configuration?.schema?.edges.map(et => [et.type, et]));
  },
});

export const vertexTypesSelector = selector({
  key: "config-vertex-types",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    return configuration?.schema?.vertices?.map(vt => vt.type) || [];
  },
});

export const edgeTypesSelector = selector({
  key: "config-edge-types",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    return configuration?.schema?.edges?.map(vt => vt.type) || [];
  },
});

export const defaultVertexTypeConfig = {
  attributes: [],
  displayNameAttribute: RESERVED_ID_PROPERTY,
  longDisplayNameAttribute: RESERVED_TYPES_PROPERTY,
  color: "#128EE5",
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
} satisfies Omit<VertexTypeConfig, "type">;

export function getDefaultVertexTypeConfig(
  vertexType: string
): VertexTypeConfig {
  return {
    ...defaultVertexTypeConfig,
    type: vertexType,
    displayLabel: sanitizeText(vertexType),
  };
}

export const defaultEdgeTypeConfig = {
  attributes: [],
  sourceArrowStyle: "none",
  targetArrowStyle: "triangle",
  lineStyle: "solid",
  lineColor: "#b3b3b3",
} satisfies Omit<EdgeTypeConfig, "type">;

export function getDefaultEdgeTypeConfig(edgeType: string): EdgeTypeConfig {
  return {
    ...defaultEdgeTypeConfig,
    type: edgeType,
    displayLabel: sanitizeText(edgeType),
  };
}

export const allNamespacePrefixesSelector = selector({
  key: "all-namespace-prefixes",
  get: ({ get }) => {
    const configuration = get(mergedConfigurationSelector);
    return configuration?.schema?.prefixes ?? [];
  },
});
