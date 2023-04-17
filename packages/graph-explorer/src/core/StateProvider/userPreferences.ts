import { atom } from "recoil";
import localForageEffect from "./localForageEffect";

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

export type UserPreferences = {
  layout: {
    activeToggles: Set<string>;
    activeSidebarItem: string | null;
    activeSidebarItemLeft: string | null;
    tableView?: {
      height: number;
    };
    detailsAutoOpenOnSelection?: boolean;
  };
  styling: {
    vertices?: Array<VertexPreferences>;
    edges?: Array<EdgePreferences>;
  };
};

export const userStylingAtom = atom<UserPreferences["styling"]>({
  key: "user-styling",
  default: {},
  effects: [localForageEffect()],
});

export const userLayoutAtom = atom<UserPreferences["layout"]>({
  key: "user-layout",
  default: {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: null,
    activeSidebarItemLeft: null,
    detailsAutoOpenOnSelection: true,
    tableView: {
      height: 300,
    },
  },
  effects: [localForageEffect()],
});
