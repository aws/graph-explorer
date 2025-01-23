import { atom, DefaultValue, selectorFamily, useSetRecoilState } from "recoil";
import localForageEffect from "./localForageEffect";
import { useCallback } from "react";

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

export type UserPreferences = {
  layout: {
    activeToggles: Set<string>;
    activeSidebarItem:
      | "search"
      | "details"
      | "filters"
      | "expand"
      | "nodes-styling"
      | "edges-styling"
      | "namespaces"
      | null;
    tableView?: {
      height: number;
    };
    detailsAutoOpenOnSelection?: boolean;
  };
  styling: UserStyling;
};
export type SidebarItems = UserPreferences["layout"]["activeSidebarItem"];

export const userStylingAtom = atom<UserStyling>({
  key: "user-styling",
  default: {},
  effects: [localForageEffect()],
});

export const userStylingNodeAtom = selectorFamily({
  key: "user-styling-node",
  get:
    (nodeType: string) =>
    ({ get }) => {
      return get(userStylingAtom).vertices?.find(
        node => node.type === nodeType
      );
    },
  set:
    (nodeType: string) =>
    ({ set }, newValue) => {
      set(userStylingAtom, prev => {
        let newNodes = Array.from(prev.vertices ?? []);
        const existingIndex = newNodes.findIndex(
          node => node.type === nodeType
        );

        if (newValue instanceof DefaultValue || !newValue) {
          // Remove the entry from user styles
          newNodes = newNodes.filter(node => node.type !== nodeType);
        } else if (existingIndex === -1) {
          // Add it because it doesn't exist
          newNodes.push(newValue);
        } else {
          // Replace the existing entry
          newNodes[existingIndex] = {
            ...newNodes[existingIndex],
            ...newValue,
          };
        }

        return {
          ...prev,
          vertices: newNodes,
        };
      });
    },
});

export const userStylingEdgeAtom = selectorFamily({
  key: "user-styling-edge",
  get:
    (edgeType: string) =>
    ({ get }) => {
      return get(userStylingAtom).edges?.find(edge => edge.type === edgeType);
    },
  set:
    (edgeType: string) =>
    ({ set }, newValue) => {
      set(userStylingAtom, prev => {
        let newEdges = Array.from(prev.edges ?? []);
        const existingIndex = newEdges.findIndex(
          edge => edge.type === edgeType
        );

        if (newValue instanceof DefaultValue || !newValue) {
          // Remove the entry from user styles
          newEdges = newEdges.filter(edge => edge.type !== edgeType);
        } else if (existingIndex === -1) {
          // Add it because it doesn't exist
          newEdges.push(newValue);
        } else {
          // Replace the existing entry
          newEdges[existingIndex] = {
            ...newEdges[existingIndex],
            ...newValue,
          };
        }

        return {
          ...prev,
          edges: newEdges,
        };
      });
    },
});

export const userLayoutAtom = atom<UserPreferences["layout"]>({
  key: "user-layout",
  default: {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: "search",
    detailsAutoOpenOnSelection: true,
    tableView: {
      height: 300,
    },
  },
  effects: [localForageEffect()],
});

export function useCloseSidebar() {
  const setUserLayout = useSetRecoilState(userLayoutAtom);
  return useCallback(() => {
    setUserLayout(prev => ({
      ...prev,
      activeSidebarItem: null,
    }));
  }, [setUserLayout]);
}
