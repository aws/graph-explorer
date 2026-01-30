import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai-family";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import {
  activeSchemaAtom,
  type AttributeConfig,
  edgePreferenceByTypeAtom,
  type EdgePreferences,
  type EdgeType,
  type EdgeTypeConfig,
  edgeTypeConfigSelector,
  vertexPreferenceByTypeAtom,
  type VertexPreferences,
  type VertexType,
  type VertexTypeConfig,
  vertexTypeConfigSelector,
} from "@/core";
import { type TextTransformer, textTransformSelector } from "@/hooks";
import { LABELS, logger, SEARCH_TOKENS } from "@/utils";

import { sortAttributeByName } from "./sortAttributeByName";

export type DisplayVertexTypeConfig = {
  type: VertexType;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
};

export type DisplayEdgeTypeConfig = {
  type: EdgeType;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
};

export type DisplayConfigAttribute = {
  name: string;
  displayLabel: string;
  dataType: string;
  isSearchable: boolean;
  dataType?: "String" | "Number" | "Date";
};

/** Gets the matching vertex type config or a generated default value. */
export function useDisplayVertexTypeConfig(type: VertexType) {
  return useAtomValue(displayVertexTypeConfigSelector(type));
}

/** All vertex types sorted by display label */
export function useDisplayVertexTypeConfigs() {
  return useAtomValue(displayVertexTypeConfigsSelector);
}

/** Gets a callback that can retrieve the given type config or generate a default value. */
export function useDisplayVertexTypeConfigCallback() {
  return useAtomCallback(
    useCallback(
      (get, _set, type: VertexType) =>
        get(displayVertexTypeConfigSelector(type)),
      [],
    ),
  );
}

/** Gets the matching edge type config or a generated default value. */
export function useDisplayEdgeTypeConfig(type: EdgeType) {
  return useAtomValue(displayEdgeTypeConfigSelector(type));
}

/** All edge types sorted by display label */
export function useDisplayEdgeTypeConfigs() {
  return useAtomValue(displayEdgeTypeConfigsSelector);
}

/**
 * Returns a list of searchable attributes for the given vertex type.
 *
 * Only attributes marked as searchable (String data type) are included.
 * When the type is `SEARCH_TOKENS.ALL_VERTEX_TYPES`, returns a deduplicated
 * list of searchable attributes from all vertex types. Otherwise, returns only
 * the searchable attributes for the specified type.
 *
 * @param type - The vertex type to get attributes for, or
 *   `SEARCH_TOKENS.ALL_VERTEX_TYPES` to get attributes from all types.
 * @returns A list of searchable display config attributes sorted by display label.
 */
export function useSearchableAttributes(type: string) {
  const displayTypeConfigs = useDisplayVertexTypeConfigs();
  const includeAllTypes = type === SEARCH_TOKENS.ALL_VERTEX_TYPES;

  const alreadyAdded = new Set<string>();
  const results: DisplayConfigAttribute[] = [];

  for (const [, value] of displayTypeConfigs) {
    if (!includeAllTypes && value.type !== type) {
      continue;
    }
    for (const attr of value.attributes) {
      if (!attr.isSearchable || alreadyAdded.has(attr.name)) {
        continue;
      }
      alreadyAdded.add(attr.name);
      results.push(attr);
    }
  }

  // Sort by name
  return results.toSorted((a, b) =>
    a.displayLabel.localeCompare(b.displayLabel),
  );
}

/** Gets the matching vertex type config or a generated default value. */
export const displayVertexTypeConfigSelector = atomFamily((type: VertexType) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const preferences = get(vertexPreferenceByTypeAtom(type));
    const typeConfig = get(vertexTypeConfigSelector(type));
    return mapToDisplayVertexTypeConfig(typeConfig, preferences, textTransform);
  }),
);

/** All vertex types sorted by display label */
export const displayVertexTypeConfigsSelector = atom(get => {
  const schema = get(activeSchemaAtom);
  return new Map(
    schema.vertices
      .map(vtConfig => get(displayVertexTypeConfigSelector(vtConfig.type)))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel))
      .map(vtConfig => [vtConfig.type, vtConfig]),
  );
});

/** Gets the matching edge type config or a generated default value. */
export const displayEdgeTypeConfigSelector = atomFamily((type: EdgeType) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const preferences = get(edgePreferenceByTypeAtom(type));
    const typeConfig = get(edgeTypeConfigSelector(type));
    return mapToDisplayEdgeTypeConfig(typeConfig, preferences, textTransform);
  }),
);

/** All edge types sorted by display label */
export const displayEdgeTypeConfigsSelector = atom(get => {
  const schema = get(activeSchemaAtom);
  return new Map(
    schema.edges
      .map(etConfig => get(displayEdgeTypeConfigSelector(etConfig.type)))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel))
      .map(etConfig => [etConfig.type, etConfig]),
  );
});

export function mapToDisplayVertexTypeConfig(
  typeConfig: VertexTypeConfig,
  preferences: VertexPreferences,
  textTransform: TextTransformer,
): DisplayVertexTypeConfig {
  const displayLabel =
    preferences.displayLabel ||
    textTransform(typeConfig.type) ||
    LABELS.MISSING_TYPE;

  const attributes: DisplayConfigAttribute[] = typeConfig.attributes
    .map(attr => ({
      name: attr.name,
      displayLabel: textTransform(attr.name),
      dataType: attr.dataType ?? LABELS.MISSING_TYPE,
      isSearchable: isAttributeSearchable(attr),
      dataType: toDisplayDataType(attr.dataType),
    }))
    .toSorted(sortAttributeByName);

  const result: DisplayVertexTypeConfig = {
    type: typeConfig.type,
    displayLabel,
    attributes,
  };
  return result;
}

export function mapToDisplayEdgeTypeConfig(
  typeConfig: EdgeTypeConfig,
  preferences: EdgePreferences,
  textTransform: TextTransformer,
): DisplayEdgeTypeConfig {
  logger.debug("Creating display edge type config", typeConfig.type);
  const displayLabel =
    preferences.displayLabel ||
    textTransform(typeConfig.type) ||
    LABELS.MISSING_TYPE;

  const attributes: DisplayConfigAttribute[] = typeConfig.attributes
    .map(attr => ({
      name: attr.name,
      displayLabel: textTransform(attr.name),
      dataType: attr.dataType ?? LABELS.MISSING_TYPE,
      isSearchable: isAttributeSearchable(attr),
      dataType: toDisplayDataType(attr.dataType),
    }))
    .toSorted(sortAttributeByName);

  const result: DisplayEdgeTypeConfig = {
    type: typeConfig.type,
    displayLabel,
    attributes,
  };
  return result;
}

function isAttributeSearchable(attribute: AttributeConfig) {
  return attribute.dataType === "String";
}

function toDisplayDataType(
  dataType: string | undefined,
): DisplayConfigAttribute["dataType"] {
  if (dataType === "Number" || dataType === "Date" || dataType === "String") {
    return dataType;
  }
  return undefined;
}
