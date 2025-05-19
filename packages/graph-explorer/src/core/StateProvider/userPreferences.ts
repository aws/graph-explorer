import { atomWithLocalForage } from "./localForageEffect";
import { useAtom } from "jotai";
import { clone } from "lodash";

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

export type VertexPreferences = {
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

export type EdgePreferences = {
  type: string;
  displayLabel?: string;
  displayNameAttribute?: string;
  labelColor?: string;
  labelBackgroundOpacity?: number;
  labelBorderColor?: string;
  labelBorderStyle?: LineStyle;
  labelBorderWidth?: number;
  labelOpacity?: string;
  lineColor?: string;
  lineThickness?: number;
  lineStyle?: LineStyle;
  sourceArrowStyle?: ArrowStyle;
  targetArrowStyle?: ArrowStyle;
};

export type UserStyling = {
  vertices?: Array<VertexPreferences>;
  edges?: Array<EdgePreferences>;
};

export const userStylingAtom = atomWithLocalForage<UserStyling>(
  {},
  "user-styling"
);

type UpdatedVertexStyle = Omit<VertexPreferences, "type">;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: string) {
  const [allStyling, setAllStyling] = useAtom(userStylingAtom);

  const vertexStyle = allStyling.vertices?.find(v => v.type === type);

  const setVertexStyle = async (updatedStyle: UpdatedVertexStyle) => {
    await setAllStyling(async prevPromise => {
      // Shallow clone so React re-renders properly
      const prev = clone(await prevPromise);

      const hasEntry = prev.vertices?.some(v => v.type === type);
      if (hasEntry) {
        // Update the existing entry, merging the updates with the existing style
        prev.vertices = prev.vertices?.map(existing => {
          if (existing.type === type) {
            return {
              ...existing,
              ...updatedStyle,
            };
          }
          return existing;
        });
      } else {
        // Add the new entry
        prev.vertices = (prev.vertices ?? []).concat({
          type,
          ...updatedStyle,
        });
      }

      return prev;
    });
  };

  const resetVertexStyle = async () =>
    await setAllStyling(async prevPromise => {
      const prev = clone(await prevPromise);
      prev.vertices = prev.vertices?.filter(v => v.type !== type);
      return prev;
    });

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
  };
}

type UpdatedEdgeStyle = Omit<EdgePreferences, "type">;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: string) {
  const [allStyling, setAllStyling] = useAtom(userStylingAtom);

  const edgeStyle = allStyling.edges?.find(v => v.type === type);

  const setEdgeStyle = async (updatedStyle: UpdatedEdgeStyle) => {
    await setAllStyling(async prevPromise => {
      // Shallow clone so React re-renders properly
      const prev = clone(await prevPromise);

      const hasEntry = prev.edges?.some(v => v.type === type);
      if (hasEntry) {
        // Update the existing entry, merging the updates with the existing style
        prev.edges = prev.edges?.map(existing => {
          if (existing.type === type) {
            return {
              ...existing,
              ...updatedStyle,
            };
          }
          return existing;
        });
      } else {
        // Add the new entry
        prev.edges = (prev.edges ?? []).concat({
          type,
          ...updatedStyle,
        });
      }

      return prev;
    });
  };

  const resetEdgeStyle = async () =>
    await setAllStyling(async prevPromise => {
      const prev = clone(await prevPromise);
      prev.edges = prev.edges?.filter(v => v.type !== type);
      return prev;
    });

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
  };
}
