import { cn } from "@/utils";
import cytoscape from "cytoscape";
import cyCanvas from "cytoscape-canvas";
import d3Force from "cytoscape-d3-force";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
import klay from "cytoscape-klay";
import {
  memo,
  useCallback,
  useImperativeHandle,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import type {
  Config,
  CytoscapeType,
  GraphEdge,
  GraphNode,
  LayoutName,
  Selection,
} from "./Graph.model";
import { runLayout } from "./helpers/layout";
import type { UseAddClickEvents } from "./hooks/useAddClickEvents";
import useAddClickEvents from "./hooks/useAddClickEvents";
import type { BlastRadiusConfig } from "./hooks/useBlastRadius";
import useBlastRadius from "./hooks/useBlastRadius";
import type { ConnectionsFilterConfig } from "./hooks/useConnectionsFilter";
import useConnectionsFilter from "./hooks/useConnectionsFilter";
import useInitCytoscape from "./hooks/useInitCytoscape";
import { useManageConfigChanges } from "./hooks/useManageConfigChanges";
import useManageElementsLock from "./hooks/useManageElementsLock";
import useManageElementsSelection from "./hooks/useManageElementsSelection";
import useManageElementsVisibility from "./hooks/useManageElementsVisibility";
import type { StyleSelector } from "./hooks/useManageStyles";
import useManageStyles from "./hooks/useManageStyles";
import type { BadgeRenderer } from "./hooks/useRenderBadges";
import useRenderBadges from "./hooks/useRenderBadges";
import useUpdateLayout from "./hooks/useRunLayout";
import useUpdateGraphElements from "./hooks/useUpdateGraphElements";
import { useGraphRef } from "./GraphContext";

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(d3Force);
cytoscape.use(fcose);
cyCanvas(cytoscape);

const EMPTY_SET = new Set<string>();

export type GraphRef = { cytoscape?: CytoscapeType; runLayout(): void };

export interface GraphProps<
  TNode extends object = any,
  TEdge extends object = any,
>
  extends
    Config,
    Selection,
    Omit<UseAddClickEvents<TNode, TEdge>, "cy">,
    Omit<ComponentPropsWithoutRef<"div">, "children" | "styles"> {
  //Data inputs
  nodes: GraphNode[];
  edges: GraphEdge[];
  //styling
  styles?: {
    [selector: string]: StyleSelector;
  };
  useAnimation?: boolean;
  // internal state of the graph
  layout?: LayoutName;
  additionalLayoutsConfig?: { [key: string]: Partial<cytoscape.LayoutOptions> };
  onLayoutUpdated?: (cy: CytoscapeType, layout: string) => any;
  //callbacks
  // TODO: Update callbacks type
  onGraphClick?: (...args: any) => any;
  onLayoutRunningChanged?: (...args: any) => any;
  onZoomChanged?: (...args: any) => any;
  onPanChanged?: (...args: any) => any;
  //components
  hiddenEdgesIds?: Set<string>;
  hiddenNodesIds?: Set<string>;
  outOfFocusNodesIds?: Set<string>;
  outOfFocusEdgesIds?: Set<string>;
  lockedNodesIds?: Set<string>;
  //property getters
  /**
   * Blast Radius Config will configure how the graph will visualize elements near a reference node (inside the blast
   * radius) or far from any reference nodes (outside the blast radius).
   * Elements inside the blast radius will get the "blast-radius-filter-in" class
   * Elements outside the blast radius will get the "blast-radius-filter-out" class.
   */
  blastRadiusConfig?: BlastRadiusConfig;
  /**
   * Connection Filters will configure how the graph will visualize elements
   * connected to a reference node.
   * Elements with connections greater than or equal to the startValue
   * or less than or equal to the endValue will get the "connections-filter-in" class
   * Elements with connections less than or equal to the startValue
   * or greater than or equal to the endValue will get the "connections-filter-out" class.
   */
  connectionsFilterConfig?: ConnectionsFilterConfig;
  badgesEnabled?: boolean;
  /**
   * Allows to define as many node badges as needed
   * @param node - node data
   * @param boundingBox - actual node bounding box.
   *                    - (x, y) coordinates are the top-left corner of square that contains the node
   * @param context - CanvasRenderingContext2D allows to draw any figure into the badge canvas
   */
  getNodeBadges?: BadgeRenderer;
  /**
   * Allows to define as many group badges as needed
   * @param group - node data
   * @param boundingBox - actual node bounding box.
   *                    - (x, y) coordinates are the top-left corner of square that contains the node
   * @param context - CanvasRenderingContext2D allows to draw any figure into the badge canvas
   */
  getGroupBadges?: BadgeRenderer;
  /**
   * (Optional) Node Id set as primary
   */
  primaryNodeId?: string;
  /**
   * By default, if clicking on graph, nodes, or edges, the selection
   * state change. If "disableSelectionEvents" is true, the selection is
   * only managed by changes in "selectedNodesIds", "selectedEdgesIds", and
   * "selectedGroupsIds".
   * If "autounselectify" is true, all selection states will be disabled.
   */
  disableSelectionEvents?: boolean;

  hideDefaultNodeLabels?: boolean;
  defaultNodeLabelAttribute?: string;
  hideDefaultEdgeLabels?: boolean;
  defaultEdgeLabelAttribute?: string;
  hideEdges?: boolean;
}

const DEFAULT_LAYOUT_CONFIG = {};

export const Graph = ({
  primaryNodeId,
  nodes,
  edges,
  selectedNodesIds,
  selectedEdgesIds,
  selectedGroupsIds,
  onSelectedElementIdsChange,
  onSelectedNodesIdsChange,
  onSelectedGroupsIdsChange,
  onSelectedEdgesIdsChange,
  className,
  styles,
  onEdgeClick,
  onEdgeRightClick,
  onEdgeDoubleClick,
  onNodeDoubleClick,
  onNodeClick,
  onNodeRightClick,
  onGraphClick,
  onGraphRightClick,
  layout = "F_COSE",
  badgesEnabled = false,
  useAnimation = true,
  pan,
  additionalLayoutsConfig = DEFAULT_LAYOUT_CONFIG,
  blastRadiusConfig,
  connectionsFilterConfig,
  onLayoutRunningChanged,
  onLayoutUpdated,
  minZoom = 0.01,
  maxZoom = 5,
  motionBlur = true,
  hideEdgesOnViewport = false,
  boxSelectionEnabled = true,
  zoom = 1,
  autounselectify = false,
  autolock = false,
  disableLockOnChange = false,
  autoungrabify = false,
  selectionType = "single",
  userPanningEnabled = true,
  userZoomingEnabled = true,
  onZoomChanged,
  onPanChanged,
  hiddenNodesIds = EMPTY_SET,
  hiddenEdgesIds = EMPTY_SET,
  lockedNodesIds = EMPTY_SET,
  outOfFocusNodesIds = EMPTY_SET,
  outOfFocusEdgesIds = EMPTY_SET,
  getNodeBadges,
  getGroupBadges,
  onGroupClick,
  onGroupDoubleClick,
  onNodeMouseDown,
  onNodeMouseOver,
  onNodeMouseOut,
  onEdgeMouseOut,
  onEdgeMouseOver,
  disableSelectionEvents = false,
  defaultNodeLabelAttribute,
  hideDefaultNodeLabels = false,
  defaultEdgeLabelAttribute,
  hideDefaultEdgeLabels = false,
  hideEdges,
  ...props
}: GraphProps) => {
  // capture wrapper via callbackRef so it triggers a re-render (and thus our cy mounting effect)
  // https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
  const [wrapper, setWrapper] = useState();
  const wrapperRefCb = useCallback(
    (domElement: any) => setWrapper(domElement),
    [],
  );
  // init cytoscape instance and attach some events listeners
  const cy = useInitCytoscape({
    wrapper,
    onLayoutRunningChanged,
    onPanChanged,
    onZoomChanged,
    zoom,
    minZoom,
    pan,
    maxZoom,
    motionBlur,
    hideEdgesOnViewport,
    boxSelectionEnabled,
    autounselectify,
    autolock,
    disableLockOnChange,
    autoungrabify,
    selectionType,
    userPanningEnabled,
    userZoomingEnabled,
  });

  const mounted = !!cy;

  useManageConfigChanges(
    {
      minZoom,
      maxZoom,
      motionBlur,
      hideEdgesOnViewport,
      boxSelectionEnabled,
      zoom,
      autounselectify,
      autolock,
      autoungrabify,
      selectionType,
      userPanningEnabled,
      userZoomingEnabled,
    },
    cy,
  );

  // this hook return a different version number each time a node/edge is added or removed, it's used to trigger
  // effects that need to run when the shape of the graph changes (like layouts)
  const graphStructureVersion = useUpdateGraphElements({
    cy,
    nodes,
    edges,
    lockedNodesIds,
    disableLockOnChange,
  });

  useManageElementsSelection(
    {
      cy,
      selectedEdgesIds,
      selectedNodesIds,
      selectedGroupsIds,
      onSelectedElementIdsChange,
      onSelectedEdgesIdsChange,
      onSelectedNodesIdsChange,
      onSelectedGroupsIdsChange,
      graphStructureVersion,
    },
    {
      autounselectify,
      disableSelectionEvents,
    },
  );

  useManageElementsVisibility({
    cy,
    hiddenEdgesIds,
    hiddenNodesIds,
    outOfFocusNodesIds,
    outOfFocusEdgesIds,
    graphStructureVersion,
    hideEdges,
  });

  useManageElementsLock({
    cy,
    autolock,
    lockedNodesIds,
    graphStructureVersion,
  });

  useManageStyles({
    cy,
    styles,
    layout,
    badgesEnabled,
    defaultNodeLabelAttribute,
    hideDefaultNodeLabels,
    defaultEdgeLabelAttribute,
    hideDefaultEdgeLabels,
  });

  useAddClickEvents({
    cy,
    onEdgeClick,
    onEdgeDoubleClick,
    onGraphClick,
    onGraphRightClick,
    onNodeClick,
    onNodeDoubleClick,
    onNodeRightClick,
    onEdgeRightClick,
    onGroupClick,
    onGroupDoubleClick,
    onNodeMouseDown,
    onNodeMouseOver,
    onNodeMouseOut,
    onEdgeMouseOut,
    onEdgeMouseOver,
  });

  useRenderBadges({
    cy,
    badgesEnabled,
    mounted,
    getNodeBadges,
    getGroupBadges,
    primaryNodeId,
  });

  useBlastRadius(graphStructureVersion, cy, blastRadiusConfig);
  useConnectionsFilter(graphStructureVersion, cy, connectionsFilterConfig);

  useUpdateLayout({
    cy,
    layout,
    onLayoutUpdated,
    useAnimation,
    additionalLayoutsConfig,
    graphStructureVersion,
    mounted,
  });

  // Set the graphRef context value so that the GraphContextProvider can access the graphRef
  const graphRef = useGraphRef();
  useImperativeHandle(
    graphRef,
    () => ({
      cytoscape: cy,
      runLayout: () => {
        if (!cy) {
          return;
        }
        runLayout(cy, layout, additionalLayoutsConfig, true);
      },
    }),
    [additionalLayoutsConfig, cy, layout],
  );

  const isEmpty = !nodes.length && !edges.length;

  return (
    <div
      className={cn("size-fulloverflow-hidden relative", className)}
      ref={wrapperRefCb}
      inert={isEmpty}
      {...props}
    />
  );
};

export default memo(Graph);
