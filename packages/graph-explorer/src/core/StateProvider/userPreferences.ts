import type { Simplify } from "type-fest";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { useDeferredValue } from "react";

import { RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";

import type { EdgeType, VertexType } from "../entities";

import { useActiveSchema } from "./schema";
import { userEdgeStylesAtom, userVertexStylesAtom } from "./storageAtoms";

export type ShapeStyle =
  | "rectangle"
  | "roundrectangle"
  | "ellipse"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "star"
  | "barrel"
  | "diamond"
  | "vee"
  | "rhomboid"
  | "tag"
  | "round-rectangle"
  | "round-triangle"
  | "round-diamond"
  | "round-pentagon"
  | "round-hexagon"
  | "round-heptagon"
  | "round-octagon"
  | "round-tag"
  | "cut-rectangle"
  | "concave-hexagon";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowStyle =
  | "triangle"
  | "triangle-tee"
  | "circle-triangle"
  | "triangle-cross"
  | "triangle-backcurve"
  | "tee"
  | "vee"
  | "square"
  | "circle"
  | "diamond"
  | "none";

/** The user preferences to be used for the specified vertex type as the type used for storing in local storage. */
export type VertexPreferencesStorageModel = {
  type: VertexType;
  /**
   * Color overwrite for vertex
   */
  color?: string;
  /**
   * Label overwrite for vertex
   */
  displayLabel?: string;
  /**
   * Icon overwrite for vertex
   */
  iconUrl?: string;
  /**
   * Icon overwrite for vertex
   */
  iconImageType?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
  shape?: ShapeStyle;
  backgroundOpacity?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: LineStyle;
};

/** The user preferences to be used for the specified edge type as the type used for storing in local storage. */
export type EdgePreferencesStorageModel = {
  type: EdgeType;
  displayLabel?: string;
  displayNameAttribute?: string;
  labelColor?: string;
  labelBackgroundOpacity?: number;
  labelBorderColor?: string;
  labelBorderStyle?: LineStyle;
  labelBorderWidth?: number;
  lineColor?: string;
  lineThickness?: number;
  lineStyle?: LineStyle;
  sourceArrowStyle?: ArrowStyle;
  targetArrowStyle?: ArrowStyle;
};

/** The user preferences to be used for the specified vertex type as an immutable object. */
export type VertexPreferences = Simplify<
  Readonly<
    Pick<VertexPreferencesStorageModel, "displayLabel"> &
      Required<Omit<VertexPreferencesStorageModel, "displayLabel">>
  >
>;

/** The user preferences to be used for the specified edge type as an immutable object. */
export type EdgePreferences = Simplify<
  Readonly<
    Pick<EdgePreferencesStorageModel, "displayLabel"> &
      Required<Omit<EdgePreferencesStorageModel, "displayLabel">>
  >
>;

/** The default values to use when no user provided value is given. */
export const defaultVertexPreferences: Omit<
  VertexPreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_ID_PROPERTY,
  longDisplayNameAttribute: RESERVED_TYPES_PROPERTY,
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  color: "#128EE5",
  shape: "ellipse",
  backgroundOpacity: 0.4,
  borderWidth: 0,
  borderColor: "#128EE5",
  borderStyle: "solid",
};

/** The default values to use when no user provided value is given. */
export const defaultEdgePreferences: Omit<
  EdgePreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_TYPES_PROPERTY,
  labelColor: "#17457b",
  labelBackgroundOpacity: 0.7,
  labelBorderColor: "#17457b",
  labelBorderStyle: "solid",
  labelBorderWidth: 0,
  lineColor: "#b3b3b3",
  lineThickness: 2,
  lineStyle: "solid",
  sourceArrowStyle: "none",
  targetArrowStyle: "triangle",
};

/**
 * @deprecated Legacy IndexedDB shape stored under the `"user-styling"` key.
 * Superseded by `userVertexStylesAtom` and `userEdgeStylesAtom`. Only referenced by
 * the startup migration in `migrateUserStyling.ts`. Do not use this type in
 * new code.
 */
export type LegacyUserStylingStorageModel = {
  vertices?: Array<VertexPreferencesStorageModel>;
  edges?: Array<EdgePreferencesStorageModel>;
};

/** Vertex preferences indexed by type for O(1) lookup with default fallback. */
export const vertexPreferencesAtom = atom(get => {
  const vertexStyles = get(userVertexStylesAtom);
  return {
    get(type: VertexType) {
      return createVertexPreference(type, vertexStyles.get(type));
    },
  };
});

/** Edge preferences indexed by type for O(1) lookup with default fallback. */
export const edgePreferencesAtom = atom(get => {
  const edgeStyles = get(userEdgeStylesAtom);
  return {
    get(type: EdgeType) {
      return createEdgePreference(type, edgeStyles.get(type));
    },
  };
});

/** Combines the stored user preferences with the defined default values. */
export function createVertexPreference(
  type: VertexType,
  stored?: VertexPreferencesStorageModel,
): VertexPreferences {
  return {
    type,
    ...defaultVertexPreferences,
    ...stored,
  } as const;
}

/** Combines the stored user preferences with the defined default values. */
export function createEdgePreference(
  type: EdgeType,
  stored?: EdgePreferencesStorageModel,
) {
  return {
    type,
    ...defaultEdgePreferences,
    ...stored,
  };
}

/** Returns an array of vertex preferences based on the known vertex types in the schema. */
export function useAllVertexPreferences(): VertexPreferences[] {
  const prefs = useAtomValue(vertexPreferencesAtom);
  const { vertices: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns an array of edge preferences based on the known edge types in the schema. */
export function useAllEdgePreferences(): EdgePreferences[] {
  const prefs = useAtomValue(edgePreferencesAtom);
  const { edges: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns the user preferences for the specified vertex type. */
export function useVertexPreferences(type: VertexType): VertexPreferences {
  return useDeferredValue(useAtomValue(vertexPreferenceByTypeAtom(type)));
}

/** Returns the user preferences for the specified edge type. */
export function useEdgePreferences(type: EdgeType): EdgePreferences {
  return useDeferredValue(useAtomValue(edgePreferenceByTypeAtom(type)));
}

/**
 * Returns the user preferences for the specified vertex type.
 */
export const vertexPreferenceByTypeAtom = atomFamily((type: VertexType) =>
  atom(get => get(vertexPreferencesAtom).get(type)),
);

/**
 * Returns the user preferences for the specified edge type.
 */
export const edgePreferenceByTypeAtom = atomFamily((type: EdgeType) =>
  atom(get => get(edgePreferencesAtom).get(type)),
);

type UpdatedVertexStyle = Partial<Omit<VertexPreferences, "type">>;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: VertexType) {
  const setVertexStyles = useSetAtom(userVertexStylesAtom);
  const vertexStyle = useVertexPreferences(type);

  const setVertexStyle = (updatedStyle: UpdatedVertexStyle) =>
    setVertexStyles(prev =>
      new Map(prev).set(type, { ...prev.get(type), ...updatedStyle, type }),
    );

  const resetVertexStyle = () =>
    setVertexStyles(prev => {
      const next = new Map(prev);
      next.delete(type);
      return next;
    });

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
  };
}

type UpdatedEdgeStyle = Partial<Omit<EdgePreferences, "type">>;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: EdgeType) {
  const setEdgeStyles = useSetAtom(userEdgeStylesAtom);
  const edgeStyle = useEdgePreferences(type);

  const setEdgeStyle = (updatedStyle: UpdatedEdgeStyle) =>
    setEdgeStyles(prev =>
      new Map(prev).set(type, { ...prev.get(type), ...updatedStyle, type }),
    );

  const resetEdgeStyle = () =>
    setEdgeStyles(prev => {
      const next = new Map(prev);
      next.delete(type);
      return next;
    });

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
  };
}
