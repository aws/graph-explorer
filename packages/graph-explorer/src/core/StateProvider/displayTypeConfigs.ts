import {
  allEdgeTypeConfigsSelector,
  allVertexTypeConfigsSelector,
  defaultEdgeTypeConfig,
  defaultVertexTypeConfig,
  edgeTypeConfigSelector,
  vertexTypeConfigSelector,
  AttributeConfig,
  EdgeTypeConfig,
  VertexTypeConfig,
  ArrowStyle,
  LineStyle,
} from "@/core";
import { TextTransformer, textTransformSelector } from "@/hooks";
import { MISSING_DISPLAY_TYPE, RESERVED_TYPES_PROPERTY } from "@/utils";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { atom, useAtomValue } from "jotai";
import { useCallback } from "react";

export type DisplayVertexStyle = {
  color: string;
  iconUrl: string;
  iconImageType: string;
};

export type DisplayVertexTypeConfig = {
  type: string;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
  style: DisplayVertexStyle;
  displayNameAttribute: string;
  displayDescriptionAttribute: string;
};

export type DisplayEdgeStyle = {
  sourceArrowStyle: ArrowStyle;
  targetArrowStyle: ArrowStyle;
  lineStyle: LineStyle;
  lineColor: string;
};
export type DisplayEdgeTypeConfig = {
  type: string;
  displayLabel: string;
  attributes: DisplayConfigAttribute[];
  style: DisplayEdgeStyle;
  displayNameAttribute: string;
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
      []
    )
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

/** Gets the matching vertex type config or a generated default value. */
export const displayVertexTypeConfigSelector = atomFamily((type: string) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const typeConfig = get(vertexTypeConfigSelector(type));
    return mapToDisplayVertexTypeConfig(typeConfig, textTransform);
  })
);

/** All vertex types sorted by display label */
export const displayVertexTypeConfigsSelector = atom(get => {
  const textTransform = get(textTransformSelector);
  return new Map(
    get(allVertexTypeConfigsSelector)
      .values()
      .map(vtConfig => mapToDisplayVertexTypeConfig(vtConfig, textTransform))
      .toArray()
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel))
      .map(vtConfig => [vtConfig.type, vtConfig])
  );
});

/** Gets the matching edge type config or a generated default value. */
export const displayEdgeTypeConfigSelector = atomFamily((type: string) =>
  atom(get => {
    const textTransform = get(textTransformSelector);
    const typeConfig = get(edgeTypeConfigSelector(type));
    return mapToDisplayEdgeTypeConfig(typeConfig, textTransform);
  })
);

/** All edge types sorted by display label */
export const displayEdgeTypeConfigsSelector = atom(get => {
  const textTransform = get(textTransformSelector);
  return new Map(
    get(allEdgeTypeConfigsSelector)
      .values()
      .map(etConfig => mapToDisplayEdgeTypeConfig(etConfig, textTransform))
      .toArray()
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel))
      .map(etConfig => [etConfig.type, etConfig])
  );
});

export function mapToDisplayVertexTypeConfig(
  typeConfig: VertexTypeConfig,
  textTransform: TextTransformer
): DisplayVertexTypeConfig {
  const displayLabel =
    typeConfig.displayLabel ||
    textTransform(typeConfig.type) ||
    MISSING_DISPLAY_TYPE;

  const attributes: DisplayConfigAttribute[] = typeConfig.attributes
    .map(attr => ({
      name: attr.name,
      displayLabel: textTransform(attr.name),
      isSearchable: isAttributeSearchable(attr),
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));

  const result: DisplayVertexTypeConfig = {
    type: typeConfig.type,
    displayLabel,
    displayNameAttribute:
      typeConfig.displayNameAttribute ??
      defaultVertexTypeConfig.displayNameAttribute,
    displayDescriptionAttribute:
      typeConfig.longDisplayNameAttribute ??
      defaultVertexTypeConfig.longDisplayNameAttribute,
    attributes,
    style: {
      color: typeConfig.color ?? defaultVertexTypeConfig.color,
      iconUrl: typeConfig.iconUrl ?? defaultVertexTypeConfig.iconUrl,
      iconImageType:
        typeConfig.iconImageType ?? defaultVertexTypeConfig.iconImageType,
    },
  };
  return result;
}

export function mapToDisplayEdgeTypeConfig(
  typeConfig: EdgeTypeConfig,
  textTransform: TextTransformer
): DisplayEdgeTypeConfig {
  const displayLabel =
    typeConfig.displayLabel ||
    textTransform(typeConfig.type) ||
    MISSING_DISPLAY_TYPE;

  const attributes: DisplayConfigAttribute[] = typeConfig.attributes
    .map(attr => ({
      name: attr.name,
      displayLabel: textTransform(attr.name),
      isSearchable: isAttributeSearchable(attr),
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));

  const style: DisplayEdgeStyle = {
    sourceArrowStyle:
      typeConfig.sourceArrowStyle || defaultEdgeTypeConfig.sourceArrowStyle,
    targetArrowStyle:
      typeConfig.targetArrowStyle || defaultEdgeTypeConfig.targetArrowStyle,
    lineStyle: typeConfig.lineStyle || defaultEdgeTypeConfig.lineStyle,
    lineColor: typeConfig.lineColor || defaultEdgeTypeConfig.lineColor,
  };

  const result: DisplayEdgeTypeConfig = {
    type: typeConfig.type,
    displayLabel,
    attributes,
    style,
    displayNameAttribute:
      typeConfig.displayNameAttribute || RESERVED_TYPES_PROPERTY,
  };
  return result;
}

function isAttributeSearchable(attribute: AttributeConfig) {
  return attribute.searchable !== false && attribute.dataType === "String";
}
