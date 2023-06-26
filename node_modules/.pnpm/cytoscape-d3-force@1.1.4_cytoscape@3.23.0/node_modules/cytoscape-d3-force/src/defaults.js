module.exports = Object.freeze({
  animate: true, // whether to show the layout as it's running; special 'end' value makes the layout animate like a discrete layout
  maxIterations: 0, // max iterations before the layout will bail out
  maxSimulationTime: 0, // max length in ms to run the layout
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
  fixedAfterDragging: false, // fixed node after dragging
  fit: false, // on every layout reposition of nodes, fit the viewport
  padding: 30, // padding around the simulation
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  /**d3-force API**/
  alpha: undefined, // sets the current alpha to the specified number in the range [0,1]
  alphaMin: undefined, // sets the minimum alpha to the specified number in the range [0,1]
  alphaDecay: undefined, // sets the alpha decay rate to the specified number in the range [0,1]
  alphaTarget: undefined, // sets the current target alpha to the specified number in the range [0,1]
  velocityDecay: undefined, // sets the velocity decay factor to the specified number in the range [0,1]
  collideRadius: undefined, // sets the radius accessor to the specified number or function
  collideStrength: undefined, // sets the force strength to the specified number in the range [0,1]
  collideIterations: undefined, // sets the number of iterations per application to the specified number
  linkId: undefined, // sets the node id accessor to the specified function
  linkDistance: 30, // sets the distance accessor to the specified number or function
  linkStrength: undefined, // sets the strength accessor to the specified number or function
  linkIterations: undefined, // sets the number of iterations per application to the specified number
  manyBodyStrength: undefined, // sets the strength accessor to the specified number or function
  manyBodyTheta: undefined, // sets the Barnes–Hut approximation criterion to the specified number
  manyBodyDistanceMin: undefined, // sets the minimum distance between nodes over which this force is considered
  manyBodyDistanceMax: undefined, // sets the maximum distance between nodes over which this force is considered
  xStrength: undefined, // sets the strength accessor to the specified number or function
  xX: undefined, // sets the x-coordinate accessor to the specified number or function
  yStrength: undefined, // sets the strength accessor to the specified number or function
  yY: undefined, // sets the y-coordinate accessor to the specified number or function
  radialStrength: undefined, // sets the strength accessor to the specified number or function
  radialRadius: undefined, // sets the circle radius to the specified number or function
  radialX: undefined, // sets the x-coordinate of the circle center to the specified number
  radialY: undefined, // sets the y-coordinate of the circle center to the specified number
  // layout event callbacks
  ready: function(){}, // on layoutready
  stop: function(){}, // on layoutstop
  tick: function() {}, // on every iteration
  // positioning options
  randomize: false, // use random node positions at beginning of layout
  // infinite layout options
  infinite: false // overrides all other options for a forces-all-the-time mode
});
