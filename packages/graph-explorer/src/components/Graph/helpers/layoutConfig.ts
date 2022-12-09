import cytoscape from "cytoscape";

export const concentricLayout = {
  name: "concentric",

  fit: true, // whether to fit the viewport to the graph
  padding: 50, // the padding on fit
  startAngle: 0, // where nodes start in radians
  sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
  clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
  equidistant: false, // whether levels have an equal radial distance betwen them, may cause bounding box overflow
  minNodeSpacing: 10, // min spacing between outside of nodes (used for radius adjustment)
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
  /*
        Excludes the label when calculating node bounding boxes for the layout algorithm
       */
  nodeDimensionsIncludeLabels: false,
  height: undefined, // height of layout area (overrides container height)
  width: undefined, // width of layout area (overrides container width)
  // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  spacingFactor: 1.5,
  concentric: function (node: cytoscape.NodeSingular) {
    // returns numeric value for each node, placing higher nodes in levels towards the centre
    return node.degree(false);
  },
  levelWidth: function () {
    return 1;
  },
  animate: true, // whether to transition the node positions
  animationDuration: 300, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  /*
         a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.
         Non-animated nodes are positioned immediately when the layout starts
      */
  animateFilter: function () {
    return true;
  },
  ready: undefined, // callback on layoutready
  stop: undefined, // callback on layoutstop
  transform: function (_node: cytoscape.NodeSingular, position: unknown) {
    return position;
  }, // transform a given node position. Useful for changing flow direction in discrete layouts
};

export const dagreLayoutHorizontal = {
  name: "dagre",

  // dagre algo options, uses default value on undefined
  nodeSep: 130, // the separation between adjacent nodes in the same rank
  edgeSep: 10, // the separation between adjacent edges in the same rank
  rankSep: 70, // the separation between adjacent nodes in the same rank
  rankDir: "TB", // 'TB' for top to bottom flow, 'LR' for left to right,
  /*
          Type of algorithm to assign a rank to each node in the Input graph. Possible values: 'network-simplex',
         'tight-tree' or 'longest-path'
       */
  ranker: undefined,
  minLen: function () {
    return 1;
  }, // number of ranks to keep between the source and target of the edge
  edgeWeight: function () {
    return 1;
  }, // higher weight edges are generally made shorter and straighter than lower weight edges

  // general layout options
  fit: true, // whether to fit to viewport
  padding: 100, // fit padding
  // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  spacingFactor: undefined,
  nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
  animate: true, // whether to transition the node positions
  // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animateFilter: function () {
    return true;
  },
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  transform: function (_node: cytoscape.NodeSingular, position: unknown) {
    return position;
  }, // a function that applies a transform to the final node position
  // ready: function () {}, // on layoutready
  // stop: function () {}, // on layoutstop
};

export const dagreLayoutVertical = {
  ...dagreLayoutHorizontal,
  rankDir: "LR",
};

export const subwayLayoutHorizontal = {
  name: "dagre",

  // dagre algo options, uses default value on undefined
  nodeSep: 100, // the separation between adjacent nodes in the same rank
  edgeSep: 10, // the separation between adjacent edges in the same rank
  rankSep: 120, // the separation between adjacent nodes in the same rank
  rankDir: "TB", // 'BT' bottom top, 'TB' for top to bottom flow, 'LR' for left to right,
  ranker: "tight-tree", // Type of algorithm to assign a rank to each node in the Input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  minLen: function () {
    return 1;
  }, // number of ranks to keep between the source and target of the edge
  edgeWeight: function () {
    return 1;
  }, // higher weight edges are generally made shorter and straighter than lower weight edges

  // general layout options
  fit: true, // whether to fit to viewport
  padding: 30, // fit padding
  spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
  animate: true, // whether to transition the node positions
  animateFilter: function () {
    return true;
  }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  transform: function (_node: cytoscape.NodeSingular, position: unknown) {
    return position;
  }, // a function that applies a transform to the final node position
  // ready: function () {}, // on layoutready
  // stop: function () {}, // on layoutstop
};

export const subwayLayoutVertical = {
  ...subwayLayoutHorizontal,
  rankDir: "LR",
};

const d3force = {
  name: "d3-force",
  animate: "end",
  padding: 60,
  alphaMin: 0.3,
  ungrabifyWhileSimulating: true,
  fit: true,
  linkId: function id(d: { id: unknown }) {
    return d.id;
  },
  linkDistance: 200,
  manyBodyStrength: -600,
  collideRadius: 2,
  manyBodyDistanceMin: 20,
  // ready: function () {},
  // stop: function () {},
  // tick: function (progress: any) {},
  randomize: false,
  infinite: false,
};

const cose = {
  name: "fcose",
  // 'draft', 'default' or 'proof'
  // - "draft" only applies spectral layout
  // - "default" improves the quality with incremental layout (fast cooling rate)
  // - "proof" improves the quality with incremental layout (slow cooling rate)
  quality: "default",
  // Use random node positions at beginning of layout
  // if this is set to false, then quality option must be "proof"
  randomize: true,
  // Type of layout animation. The option set is {'during', 'end', false}
  animate: "end",
  // Duration of animation in ms, if enabled
  animationDuration: 400,
  // Easing of animation, if enabled
  animationEasing: undefined,
  // Fit the viewport to the repositioned nodes
  fit: true,
  // Padding around layout
  padding: 30,
  animationThreshold: 200,
  // number of ticks per frame; higher is faster but more jerky
  refresh: 1,
  // Whether to include labels in node dimensions. Valid in "proof" quality
  nodeDimensionsIncludeLabels: false,
  // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
  uniformNodeDimensions: false,
  // Whether to pack disconnected components - valid only if randomize: true
  packComponents: true,

  /* spectral layout options */

  // False for random, true for greedy sampling
  samplingType: false,
  // Sample size to construct distance matrix
  sampleSize: 50,
  // Separation amount between nodes
  nodeSeparation: 1000,
  // Power iteration tolerance
  piTol: 0.0000001,

  /* incremental layout options */

  // Node repulsion (non overlapping) multiplier
  nodeRepulsion: 4500,
  // Ideal edge (non nested) length
  idealEdgeLength: 100,
  // Divisor to compute edge forces
  edgeElasticity: 0.55,
  // Nesting factor (multiplier) to compute ideal edge length for nested edges
  nestingFactor: 0.1,
  // Maximum number of iterations to perform
  numIter: 2500,
  // For enabling tiling
  tile: true,
  /*
         Represents the amount of the vertical space to put between the zero degree members during the tiling
         operation(can also be a function)
       */
  tilingPaddingVertical: 20,
  /*
         Represents the amount of the horizontal space to put between the zero degree members during the tiling
         operation(can also be a function)
       */
  tilingPaddingHorizontal: 20,
  // Gravity force (constant)
  gravity: 0.25,
  // Gravity range (constant) for compounds
  gravityRangeCompound: 1.5,
  // Gravity force (constant) for compounds
  gravityCompound: 1.0,
  // Gravity range (constant)
  gravityRange: 2,
  // Initial cooling factor for incremental layout
  initialEnergyOnIncremental: 1,
};

const klayLayout = {
  name: "klay",
  nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
  fit: true, // Whether to fit
  padding: 20, // Padding on fit
  animate: true, // Whether to transition the node positions
  animateFilter: function () {
    return true;
  }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 200, // Duration of animation in ms if enabled
  animationEasing: undefined, // Easing of animation if enabled
  transform: function (_node: cytoscape.NodeSingular, position: unknown) {
    return position;
  }, // A function that applies a transform to the final node position
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  klay: {
    // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
    addUnnecessaryBendpoints: true, // Adds bend points even if an edge does not change direction.
    aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
    borderSpacing: 20, // Minimal amount of space to be left to the border
    compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
    crossingMinimization: "LAYER_SWEEP", // Strategy for crossing minimization.
    /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
            INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the Input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
    cycleBreaking: "GREEDY", // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
    /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
            INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the Input graph. This requires node and port coordinates to have been set to sensible values.*/
    direction: "RIGHT", // Overall direction of edges: horizontal (right / left) or vertical (down / up)
    /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
    edgeRouting: "ORTHOGONAL", // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
    edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
    feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
    fixedAlignment: "NONE", // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
    /* NONE Chooses the smallest layout from the four possible candidates.
            LEFTUP Chooses the left-up candidate from the four possible candidates.
            RIGHTUP Chooses the right-up candidate from the four possible candidates.
            LEFTDOWN Chooses the left-down candidate from the four possible candidates.
            RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
            BALANCED Creates a balanced layout from the four possible candidates. */
    inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
    layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
    linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
    mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
    mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
    nodeLayering: "NETWORK_SIMPLEX", // Strategy for node layering.
    /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
            LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
            INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the Input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
    nodePlacement: "LINEAR_SEGMENTS", // Strategy for Node Placement
    /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
            LINEAR_SEGMENTS Computes a balanced placement.
            INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
            SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
    randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
    routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
    separateConnectedComponents: true, // Whether each connected component should be processed separately
    spacing: 64, // Overall setting for the minimal amount of space to be left between objects
    thoroughness: 7, // How much effort should be spent to produce a nice layout..
  },
  priority: function () {
    return null;
  }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
};

export const availableLayoutsConfig: Record<string, any> = {
  CONCENTRIC: concentricLayout,
  DAGRE_HORIZONTAL: dagreLayoutHorizontal,
  DAGRE_VERTICAL: dagreLayoutVertical,
  F_COSE: cose,
  D3: d3force,
  KLAY: klayLayout,
  SUBWAY_HORIZONTAL: subwayLayoutHorizontal,
  SUBWAY_VERTICAL: subwayLayoutVertical,
};
