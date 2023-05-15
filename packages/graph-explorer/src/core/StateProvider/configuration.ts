import { uniq } from "lodash";
import { atom, selector } from "recoil";
import { sanitizeText } from "../../utils";
import DEFAULT_ICON_URL from "../../utils/defaultIconUrl";
import type {
  AttributeConfig,
  EdgeTypeConfig,
  RawConfiguration,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import localForageEffect from "./localForageEffect";
import { schemaAtom } from "./schema";
import {
  EdgePreferences,
  userStylingAtom,
  VertexPreferences,
} from "./userPreferences";

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

export const mergedConfigurationSelector = selector<RawConfiguration | null>({
  key: "merged-configuration",
  get: ({ get }) => {
    const activeConfig = get(activeConfigurationAtom);
    const config = get(configurationAtom);
    const currentConfig = activeConfig && config.get(activeConfig);
    if (!currentConfig) {
      return null;
    }

    const schema = get(schemaAtom);
    const currentSchema = activeConfig ? schema.get(activeConfig) : null;
    const userStyling = get(userStylingAtom);

    const configVLabels = currentConfig.schema?.vertices.map(v => v.type) || [];
    const schemaVLabels = currentSchema?.vertices?.map(v => v.type) || [];
    const allVertexLabels = uniq([...configVLabels, ...schemaVLabels]);
    const mergedVertices = allVertexLabels
      .map(vLabel => {
        const configVertex = currentConfig.schema?.vertices.find(
          v => v.type === vLabel
        );
        const schemaVertex = currentSchema?.vertices.find(
          v => v.type === vLabel
        );
        const prefsVertex = userStyling.vertices?.find(v => v.type === vLabel);

        return mergeVertex(configVertex, schemaVertex, prefsVertex);
      })
      .sort((a, b) => a.type.localeCompare(b.type));

    const configELabels = currentConfig.schema?.edges.map(v => v.type) || [];
    const schemaELabels = currentSchema?.edges?.map(v => v.type) || [];
    const allEdgeLabels = uniq([...configELabels, ...schemaELabels]);
    const mergedEdges = allEdgeLabels.map(vLabel => {
      const configEdge = currentConfig.schema?.edges.find(
        v => v.type === vLabel
      );
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
  },
});

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
    type: vt,
    displayLabel: sanitizeText(vt),
    color: "#128EE5",
    iconUrl: DEFAULT_ICON_URL,
    iconImageType: "image/svg+xml",
    displayNameAttribute: "id",
    longDisplayNameAttribute: "types",
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

  return {
    // Defaults
    type: "unknown",
    displayLabel: "Unknown",
    // Automatic schema override
    ...(schemaEdge || {}),
    // File-based override
    ...(configEdge || {}),
    // User preferences override
    ...(preferences || {}),
    attributes,
  };
};
