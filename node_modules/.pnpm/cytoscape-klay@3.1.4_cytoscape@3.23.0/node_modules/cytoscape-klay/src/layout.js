const klay = require('klayjs');
const assign = require('./assign');
const defaults = require('./defaults');

const klayNSLookup = {
  'addUnnecessaryBendpoints': 'de.cau.cs.kieler.klay.layered.unnecessaryBendpoints',
  'alignment': 'de.cau.cs.kieler.alignment',
  'aspectRatio': 'de.cau.cs.kieler.aspectRatio',
  'borderSpacing': 'borderSpacing',
  'compactComponents': 'de.cau.cs.kieler.klay.layered.components.compact',
  'compactionStrategy': 'de.cau.cs.kieler.klay.layered.nodeplace.compactionStrategy',
  'contentAlignment': 'de.cau.cs.kieler.klay.layered.contentAlignment',
  'crossingMinimization': 'de.cau.cs.kieler.klay.layered.crossMin',
  'cycleBreaking': 'de.cau.cs.kieler.klay.layered.cycleBreaking',
  'debugMode': 'de.cau.cs.kieler.debugMode',
  'direction': 'de.cau.cs.kieler.direction',
  'edgeLabelSideSelection': 'de.cau.cs.kieler.klay.layered.edgeLabelSideSelection',
  // <broken> 'de.cau.cs.kieler.klay.layered.edgeNodeSpacingFactor': options.edgeNodeSpacingFactor,
  'edgeRouting': 'de.cau.cs.kieler.edgeRouting',
  'edgeSpacingFactor': 'de.cau.cs.kieler.klay.layered.edgeSpacingFactor',
  'feedbackEdges': 'de.cau.cs.kieler.klay.layered.feedBackEdges',
  'fixedAlignment': 'de.cau.cs.kieler.klay.layered.fixedAlignment',
  'greedySwitchCrossingMinimization': 'de.cau.cs.kieler.klay.layered.greedySwitch',
  'hierarchyHandling': 'de.cau.cs.kieler.hierarchyHandling',
  'inLayerSpacingFactor': 'de.cau.cs.kieler.klay.layered.inLayerSpacingFactor',
  'interactiveReferencePoint': 'de.cau.cs.kieler.klay.layered.interactiveReferencePoint',
  'layerConstraint': 'de.cau.cs.kieler.klay.layered.layerConstraint',
  'layoutHierarchy': 'de.cau.cs.kieler.layoutHierarchy',
  'linearSegmentsDeflectionDampening': 'de.cau.cs.kieler.klay.layered.linearSegmentsDeflectionDampening',
  'mergeEdges': 'de.cau.cs.kieler.klay.layered.mergeEdges',
  'mergeHierarchyCrossingEdges': 'de.cau.cs.kieler.klay.layered.mergeHierarchyEdges',
  'noLayout': 'de.cau.cs.kieler.noLayout',
  'nodeLabelPlacement': 'de.cau.cs.kieler.nodeLabelPlacement',
  'nodeLayering': 'de.cau.cs.kieler.klay.layered.nodeLayering',
  'nodePlacement': 'de.cau.cs.kieler.klay.layered.nodePlace',
  'portAlignment': 'de.cau.cs.kieler.portAlignment',
  'portAlignmentEastern': 'de.cau.cs.kieler.portAlignment.east',
  'portAlignmentNorth': 'de.cau.cs.kieler.portAlignment.north',
  'portAlignmentSouth': 'de.cau.cs.kieler.portAlignment.south',
  'portAlignmentWest': 'de.cau.cs.kieler.portAlignment.west',
  'portConstraints': 'de.cau.cs.kieler.portConstraints',
  'portLabelPlacement': 'de.cau.cs.kieler.portLabelPlacement',
  'portOffset': 'de.cau.cs.kieler.offset',
  'portSide': 'de.cau.cs.kieler.portSide',
  'portSpacing': 'de.cau.cs.kieler.portSpacing',
  'postCompaction': 'de.cau.cs.kieler.klay.layered.postCompaction',
  'priority': 'de.cau.cs.kieler.priority',
  'randomizationSeed': 'de.cau.cs.kieler.randomSeed',
  'routeSelfLoopInside': 'de.cau.cs.kieler.selfLoopInside',
  'separateConnectedComponents': 'de.cau.cs.kieler.separateConnComp',
  'sizeConstraint': 'de.cau.cs.kieler.sizeConstraint',
  'sizeOptions': 'de.cau.cs.kieler.sizeOptions',
  'spacing': 'de.cau.cs.kieler.spacing',
  'splineSelfLoopPlacement': 'de.cau.cs.kieler.klay.layered.splines.selfLoopPlacement',
  'thoroughness': 'de.cau.cs.kieler.klay.layered.thoroughness',
  'wideNodesOnMultipleLayers': 'de.cau.cs.kieler.klay.layered.wideNodesOnMultipleLayers'
};

const mapToKlayNS = function( klayOpts ){
  let keys = Object.keys( klayOpts );
  let ret = {};

  for( let i = 0; i < keys.length; i++ ){
    let key = keys[i];
    let nsKey = klayNSLookup[key];
    let val = klayOpts[key];

    ret[ nsKey ] = val;
  }

  return ret;
};

const klayOverrides = {
  interactiveReferencePoint: 'CENTER', // Determines which point of a node is considered by interactive layout phases.
};

const getPos = function( ele ){
  let parent = ele.parent();
  let k = ele.scratch('klay');
  let p = {
    x: k.x,
    y: k.y
  };

  while (parent.nonempty()) {
    var kp = parent.scratch('klay');
    p.x += kp.x;
    p.y += kp.y;
    parent = parent.parent();
  }

  return p;
};

const makeNode = function( node, options ){
  let dims = node.layoutDimensions( options );
  let padding = node.numericStyle('padding');

  let k = {
    _cyEle: node,
    id: node.id(),
    padding: {
      top: padding,
      left: padding,
      bottom: padding,
      right: padding
    }
  };

  if( !node.isParent() ){
    k.width = dims.w;
    k.height = dims.h;
  }

  node.scratch('klay', k);

  return k;
};

const makeEdge = function( edge, options ){
  let k = {
    _cyEle: edge,
    id: edge.id(),
    source: edge.data('source'),
    target: edge.data('target'),
    properties: {}
  };

  let priority = options.priority( edge );

  if( priority != null ){
    k.properties.priority = priority;
  }

  edge.scratch('klay', k);

  return k;
};

const makeGraph = function( nodes, edges, options ){
  let klayNodes = [];
  let klayEdges = [];
  let klayEleLookup = {};
  let graph = {
    id: 'root',
    children: [],
    edges: []
  };

  // map all nodes
  for( let i = 0; i < nodes.length; i++ ){
    let n = nodes[i];
    let k = makeNode( n, options );

    klayNodes.push( k );

    klayEleLookup[ n.id() ] = k;
  }

  // map all edges
  for( let i = 0; i < edges.length; i++ ){
    let e = edges[i];
    let k = makeEdge( e, options );

    klayEdges.push( k );

    klayEleLookup[ e.id() ] = k;
  }

  // make hierarchy
  for( let i = 0; i < klayNodes.length; i++ ){
    let k = klayNodes[i];
    let n = k._cyEle;

    if( !n.isChild() ){
      graph.children.push( k );
    } else {
      let parent = n.parent();
      let parentK = klayEleLookup[ parent.id() ];

      let children = parentK.children = parentK.children || [];

      children.push( k );
    }
  }

  for( let i = 0; i < klayEdges.length; i++ ){
    let k = klayEdges[i];
    let e = k._cyEle;
    let parentSrc = e.source().parent();
    let parentTgt = e.target().parent();

    // put all edges in the top level for now
    // TODO does this cause issues in certain edgecases?
    if( false && parentSrc.nonempty() && parentTgt.nonempty() && parentSrc.same( parentTgt ) ){
      let kp = klayEleLookup[ parentSrc.id() ];

      kp.edges = kp.edges || [];

      kp.edges.push( k );
    } else {
      graph.edges.push( k );
    }

  }

  return graph;
};

function Layout( options ){
  let klayOptions = options.klay;

  this.options = assign( {}, defaults, options );

  this.options.klay = assign( {}, defaults.klay, klayOptions, klayOverrides );
}

Layout.prototype.run = function(){
  let layout = this;
  let options = this.options;

  let eles = options.eles;
  let nodes = eles.nodes();
  let edges = eles.edges();

  let graph = makeGraph( nodes, edges, options );

  klay.layout({
    graph: graph,
    options: mapToKlayNS( options.klay ),
    success: function () {
    },
    error: function(error){
      throw error;
    }
  });

  nodes.filter(function(n){
    return !n.isParent();
  }).layoutPositions( layout, options, getPos );

  return this;
};

Layout.prototype.stop = function(){
  return this; // chaining
};

Layout.prototype.destroy = function(){
  return this; // chaining
};

module.exports = Layout;
