import { atomWithLocalForage } from "./localForageEffect";
import { atomFamily, RESET } from "jotai/utils";
import { atom, useSetAtom } from "jotai";
import { SetStateActionWithReset } from "@/utils/jotai";

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

export const userStylingAtom = atomWithLocalForage<UserStyling>(
  {},
  "user-styling"
);

export const userStylingNodeAtom = atomFamily((nodeType: string) =>
  atom(
    get => {
      return get(userStylingAtom).vertices?.find(
        node => node.type === nodeType
      );
    },

    async (
      _get,
      set,
      update: SetStateActionWithReset<VertexPreferences | undefined>
    ) => {
      await set(userStylingAtom, async prevUserStyling => {
        let newNodes = Array.from((await prevUserStyling).vertices ?? []);
        const existingIndex = newNodes.findIndex(
          node => node.type === nodeType
        );
        const prev = existingIndex !== -1 ? newNodes[existingIndex] : undefined;

        const newValue = typeof update === "function" ? update(prev) : update;

        if (newValue === RESET || !newValue) {
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
    }
  )
);

export const userStylingEdgeAtom = atomFamily((edgeType: string) =>
  atom(
    get => {
      return get(userStylingAtom).edges?.find(edge => edge.type === edgeType);
    },
    async (
      _get,
      set,
      update: SetStateActionWithReset<EdgePreferences | undefined>
    ) => {
      await set(userStylingAtom, async prev => {
        let newEdges = Array.from((await prev).edges ?? []);
        const existingIndex = newEdges.findIndex(
          edge => edge.type === edgeType
        );
        const prevValue =
          existingIndex !== -1 ? newEdges[existingIndex] : undefined;
        const newValue =
          typeof update === "function" ? update(prevValue) : update;

        if (newValue === RESET || !newValue) {
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
    }
  )
);

export const userLayoutAtom = atomWithLocalForage<UserPreferences["layout"]>(
  {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: "search",
    detailsAutoOpenOnSelection: true,
    tableView: {
      height: 300,
    },
  },
  "user-layout"
);

export function useCloseSidebar() {
  const setUserLayout = useSetAtom(userLayoutAtom);
  return () => {
    setUserLayout(prev => ({
      ...prev,
      activeSidebarItem: null,
    }));
  };
}
