import cytoscape from "cytoscape";

export type CytoscapeCanvas = {
  cyCanvas: () => CytoscapeCanvas;
  getCanvas: () => HTMLCanvasElement;
  clear: (context: CanvasRenderingContext2D) => void;
  resetTransform: (context: CanvasRenderingContext2D) => void;
  setTransform: (context: CanvasRenderingContext2D) => void;
};

export type CytoscapeType = cytoscape.Core & Partial<CytoscapeCanvas>;

export type Config = {
  minZoom?: number;
  maxZoom?: number;
  motionBlur?: boolean;
  hideEdgesOnViewport?: boolean;
  boxSelectionEnabled?: boolean;
  zoom?: number;
  autounselectify?: boolean;
  autolock?: boolean;
  /**
   * Nodes are locked while adding or removing nodes from the canvas.
   * By setting disableLockOnChange to true, every time that a node is added or removed
   * the entire layout is recomputed.
   */
  disableLockOnChange?: boolean;
  autoungrabify?: boolean;
  selectionType?: "additive" | "single";
  userPanningEnabled?: boolean;
  userZoomingEnabled?: boolean;
  pan?: {
    x: number;
    y: number;
  };
};

export type Selection = {
  selectedNodesIds?: Array<string> | Set<string>;
  selectedEdgesIds?: Array<string> | Set<string>;
  selectedGroupsIds?: Array<string> | Set<string>;
  onSelectedNodesIdsChange?(nodesIds: Array<string> | Set<string>): void;
  onSelectedGroupsIdsChange?(
    groupsIds: Array<string> | Set<string>,
    visibleChildrenIds: Array<string> | Set<string>
  ): void;
  onSelectedEdgesIdsChange?(edgesIds: Array<string> | Set<string>): void;
};

export type LayoutName =
  | "CONCENTRIC"
  | "DAGRE_HORIZONTAL"
  | "DAGRE_VERTICAL"
  | "F_COSE"
  | "D3"
  | "KLAY"
  | "SUBWAY_HORIZONTAL"
  | "SUBWAY_VERTICAL";

export type GraphNode = {
  data: {
    id: string;
  };
};

export type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
  };
};

export type TextStyle = {
  background: string;
  border: {
    width: number;
    opacity: number;
    color: string;
    style: cytoscape.Css.LineStyle;
  };
  color: string;
  fontSize: number;
  hAlign: "left" | "right" | "center";
  maxWidth: number;
  minZoomedFontSize: number;
  opacity: number;
  padding: number;
  rotation: "autorotate" | string;
  shape: "rectangle" | "round-rectangle";
  vAlign: "bottom" | "top" | "center";
  vMargin: number;
  wrap: "none" | "wrap" | "ellipsis";
};

export type NodeStyle = {
  background: string;
  backgroundFit?: "none" | "contain" | "cover";
  backgroundWidth?: string;
  backgroundHeight?: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  borderColor: string;
  borderOpacity: number;
  borderStyle: cytoscape.Css.LineStyle;
  borderWidth: number;
  color: string;
  height: number;
  label?: string | ((node: cytoscape.NodeSingular) => string);
  opacity: number;
  padding: number;
  shape: cytoscape.Css.NodeShape;
  text: TextStyle;
  transitionDuration?: string;
  transitionProperty?: string;
  visible?: boolean;
  width: number;
  underlayOpacity?: number;
  underlayColor?: string;
};

export type CyTextStyle = {
  textBackgroundColor: string;
  textBackgroundOpacity: number;
  textBackgroundPadding: number;
  textBackgroundShape: "rectangle" | "round-rectangle";
  textBorderColor: string;
  textBorderOpacity: number;
  textBorderStyle: "solid" | "dotted" | "dashed" | "double";
  textBorderWidth: number;
  color: string;
  textHalign: "left" | "right" | "center";
  textMarginY: number;
  textMaxWidth: number;
  minZoomedFontSize: number;
  textRotation: "autorotate" | string;
  textValign: "bottom" | "top" | "center";
  textWrap: "none" | "wrap" | "ellipsis";
};

export type CyNodeStyle = CyTextStyle & {
  backgroundColor: string;
  backgroundFit?: "none" | "contain" | "cover";
  backgroundHeight?: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  backgroundWidth?: string;
  borderColor: string;
  borderOpacity: number;
  borderStyle: cytoscape.Css.LineStyle;
  borderWidth: number;
  color: string;
  display?: string;
  fontSize: number;
  height: number;
  label?: string | ((node: cytoscape.NodeSingular) => string);
  opacity: number;
  padding?: number;
  shape: cytoscape.Css.NodeShape;
  transitionDuration?: string;
  transitionProperty?: string;
  underlayColor?: string;
  underlayOpacity?: number;
  width: number;
};

export type CurveStyle =
  | "haystack"
  | "straight"
  | "bezier"
  | "unbundled-bezier"
  | "segments"
  | "taxi";

export type EdgeStyle = {
  color: string;
  curveStyle: CurveStyle;
  label?: string | ((edge: cytoscape.EdgeSingular) => string);
  lineCap: "butt" | "round" | "square";
  lineColor: string;
  lineStyle: cytoscape.Css.LineStyle;
  opacity: number;
  sourceArrowColor: string;
  sourceArrowShape: cytoscape.Css.ArrowShape;
  targetArrowColor: string;
  targetArrowShape: cytoscape.Css.ArrowShape;
  taxiDirection?: string;
  text: TextStyle;
  transitionDuration?: string;
  transitionProperty?: string;
  visible: boolean;
  width: number;
  underlayOpacity?: number;
  underlayColor?: string;
  underlayPadding?: number;
};

export type CyEdgeStyle = CyTextStyle & {
  background: string;
  color: string;
  curveStyle: CurveStyle;
  display?: string;
  fontSize: number;
  label?: string | ((edge: cytoscape.EdgeSingular) => string);
  lineCap: "butt" | "round" | "square";
  lineColor: string;
  lineStyle: cytoscape.Css.LineStyle;
  opacity: number;
  sourceArrowColor: string;
  sourceArrowShape: cytoscape.Css.ArrowShape;
  targetArrowColor: string;
  targetArrowShape: cytoscape.Css.ArrowShape;
  transitionDuration?: string;
  transitionProperty?: string;
  width: number;
  underlayOpacity?: number;
  underlayColor?: string;
  underlayPadding?: number;
};
