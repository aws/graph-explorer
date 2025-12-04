import {
  activeSchemaAtom,
  edgePreferenceByTypeAtom,
  edgeTypeConfigSelector,
  vertexPreferenceByTypeAtom,
  vertexTypeConfigSelector,
  type AttributeConfig,
  type EdgePreferences,
  type EdgeTypeConfig,
  type VertexPreferences,
  type VertexTypeConfig,
} from "@/core";
import { type TextTransformer, textTransformSelector } from "@/hooks";
import { LABELS, logger, SEARCH_TOKENS } from "@/utils";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { atom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { sortAttributeByName } from "./sortAttributeByName";

export type DisplayVertexTypeConfig = {
  type: string;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
};

export type DisplayEdgeTypeConfig = {
  type: string;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
};

export type DisplayConfigAttribute = {
  name: string;
  displayLabel: string;
  isSearchable: boolean;
};

/** Gets the matching vertex type config or a generated default value. */
export function useDisplayVertexTypeConfig(type: string) {
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
      (get, _set, type: string) => get(displayVertexTypeConfigSelector(type)),
      [],
    ),
  );
}

/** Gets the matching edge type config or a generated default value. */
export function useDisplayEdgeTypeConfig(type: string) {
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
export const displayVertexTypeConfigSelector = atomFamily((type: string) =>
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
export const displayEdgeTypeConfigSelector = atomFamily((type: string) =>
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
  logger.debug("Creating display vertex type config", typeConfig.type);
  const displayLabel =
    preferences.displayLabel ||
    textTransform(typeConfig.type) ||
    LABELS.MISSING_TYPE;

  const attributes: DisplayConfigAttribute[] = typeConfig.attributes
    .map(attr => ({
      name: attr.name,
      displayLabel: textTransform(attr.name),
      isSearchable: isAttributeSearchable(attr),
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
      isSearchable: isAttributeSearchable(attr),
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
