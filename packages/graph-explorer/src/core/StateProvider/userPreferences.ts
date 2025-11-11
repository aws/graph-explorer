import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";
import { atomWithLocalForage } from "./atomWithLocalForage";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useDeferredValue } from "react";
import { RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import type { Simplify } from "type-fest";
import { useActiveSchema } from "./schema";
import { atomFamily } from "jotai/utils";

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

export type VertexPreferencesStorageModel = {
  type: string;
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

export type EdgePreferencesStorageModel = {
  type: string;
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

export type VertexPreferences = Simplify<
  Readonly<
    Pick<VertexPreferencesStorageModel, "displayLabel"> &
      Required<Omit<VertexPreferencesStorageModel, "displayLabel">>
  >
>;

export type EdgePreferences = Simplify<
  Readonly<
    Pick<EdgePreferencesStorageModel, "displayLabel"> &
      Required<Omit<EdgePreferencesStorageModel, "displayLabel">>
  >
>;

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

export const userStylingAtom = atomWithLocalForage<UserStyling>(
  "user-styling",
  {}
);

/** Get the stored user preferences for vertices and edges in a fast lookup Map. */
function useStoredGraphPreferences() {
  const graphPreferences = useAtomValue(userStylingAtom);
  const vertices = new Map(
    graphPreferences.vertices?.map(v => [v.type, v]) ?? []
  );
  const edges = new Map(graphPreferences.edges?.map(e => [e.type, e]) ?? []);
  const result = { vertices, edges };
  const deferredResult = useDeferredValue(result);
  return deferredResult;
}

export function createVertexPreference(
  type: string,
  stored: VertexPreferencesStorageModel | undefined
): VertexPreferences {
  return {
    type,
    ...defaultVertexPreferences,
    ...stored,
  } as const;
}

export function useAllVertexPreferences(): VertexPreferences[] {
  const { vertices: allPreferences } = useStoredGraphPreferences();
  const { vertices: allSchemas } = useActiveSchema();

  return allSchemas.map(({ type }) =>
    createVertexPreference(type, allPreferences.get(type))
  );
}

export function createEdgePreference(
  type: string,
  stored: EdgePreferencesStorageModel | undefined
) {
  return {
    type,
    ...defaultEdgePreferences,
    ...stored,
  };
}

export function useAllEdgePreferences(): EdgePreferences[] {
  const { edges: allPreferences } = useStoredGraphPreferences();
  const { edges: allSchemas } = useActiveSchema();

  return allSchemas.map(({ type }) =>
    createEdgePreference(type, allPreferences.get(type))
  );
}

export function useVertexPreference(type: string): VertexPreferences {
  const { vertices: allPreferences } = useStoredGraphPreferences();
  const vertexPreference = allPreferences.get(type);
  return createVertexPreference(type, vertexPreference);
}

export function useEdgePreference(type: string): EdgePreferences {
  const { edges: allPreferences } = useStoredGraphPreferences();
  const edgePreference = allPreferences.get(type);
  return createEdgePreference(type, edgePreference);
}

export const vertexPreferenceByTypeAtom = atomFamily((type: string) =>
  atom(get => {
    const userStyling = get(userStylingAtom);
    const stored = userStyling.vertices?.find(v => v.type === type);
    return createVertexPreference(type, stored);
  })
);

type UpdatedVertexStyle = Omit<VertexPreferencesStorageModel, "type">;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: string) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const vertexStyle = useVertexPreference(type);

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
export function useEdgeStyling(type: string) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const edgeStyle = useEdgePreference(type);

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
