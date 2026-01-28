import type { Simplify } from "type-fest";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { useDeferredValue } from "react";

import { logger, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";

import type { EdgeType, VertexType } from "../entities";

import { useActiveSchema } from "./schema";
import { userStylingAtom } from "./storageAtoms";

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

export type UserStyling = {
  vertices?: Array<VertexPreferencesStorageModel>;
  edges?: Array<EdgePreferencesStorageModel>;
};

/** Get the stored user preferences for vertices and edges in a fast lookup Map. */
function useStoredGraphPreferences() {
  const graphPreferences = useAtomValue(userStylingAtom);
  const vertices = new Map(
    graphPreferences.vertices?.map(v => [v.type, v]) ?? [],
  );
  const edges = new Map(graphPreferences.edges?.map(e => [e.type, e]) ?? []);
  const result = { vertices, edges };
  const deferredResult = useDeferredValue(result);
  return deferredResult;
}

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
  logger.debug("Creating EdgePreference", { type, stored });
  return {
    type,
    ...defaultEdgePreferences,
    ...stored,
  };
}

/** Returns an array of vertex preferences based on the known vertex types in the schema. */
export function useAllVertexPreferences(): VertexPreferences[] {
  const { vertices: allPreferences } = useStoredGraphPreferences();
  const { vertices: allSchemas } = useActiveSchema();

  return allSchemas.map(({ type }) =>
    createVertexPreference(type, allPreferences.get(type)),
  );
}

/** Returns an array of edge preferences based on the known edge types in the schema. */
export function useAllEdgePreferences(): EdgePreferences[] {
  const { edges: allPreferences } = useStoredGraphPreferences();
  const { edges: allSchemas } = useActiveSchema();

  return allSchemas.map(({ type }) =>
    createEdgePreference(type, allPreferences.get(type)),
  );
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
  atom(get => {
    const userStyling = get(userStylingAtom);
    const stored = userStyling.vertices?.find(v => v.type === type);
    return createVertexPreference(type, stored);
  }),
);

/**
 * Returns the user preferences for the specified edge type.
 */
export const edgePreferenceByTypeAtom = atomFamily((type: EdgeType) =>
  atom(get => {
    const userStyling = get(userStylingAtom);
    const stored = userStyling.edges?.find(e => e.type === type);
    return createEdgePreference(type, stored);
  }),
);

type UpdatedVertexStyle = Partial<Omit<VertexPreferences, "type">>;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: VertexType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const vertexStyle = useVertexPreferences(type);

  const setVertexStyle = (updatedStyle: UpdatedVertexStyle) =>
    setAllStyling(prev => {
      const vertices = prev.vertices ?? [];
      const existingIndex = vertices.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedVertices = [...vertices];
        updatedVertices[existingIndex] = {
          ...vertices[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, vertices: updatedVertices };
      } else {
        // Add new entry
        return { ...prev, vertices: [...vertices, { type, ...updatedStyle }] };
      }
    });

  const resetVertexStyle = () =>
    setAllStyling(prev => {
      return {
        ...prev,
        vertices: prev.vertices?.filter(v => v.type !== type),
      };
    });

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
  };
}

type UpdatedEdgeStyle = Omit<EdgePreferencesStorageModel, "type">;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: EdgeType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const edgeStyle = useEdgePreferences(type);

  const setEdgeStyle = (updatedStyle: UpdatedEdgeStyle) =>
    setAllStyling(prev => {
      const edges = prev.edges ?? [];
      const existingIndex = edges.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedEdges = [...edges];
        updatedEdges[existingIndex] = {
          ...edges[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, edges: updatedEdges };
      } else {
        // Add new entry
        return { ...prev, edges: [...edges, { type, ...updatedStyle }] };
      }
    });

  const resetEdgeStyle = () =>
    setAllStyling(prev => {
      return {
        ...prev,
        edges: prev.edges?.filter(v => v.type !== type),
      };
    });

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
  };
}
