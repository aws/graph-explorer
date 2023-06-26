cytoscape-d3-force
================================================================================


## Description

d3-force for cytoscape.js ([demo](https://shichuanpo.github.io/cytoscape.js-d3-force/demo.html))([demo-bigdata](https://shichuanpo.github.io/cytoscape.js-d3-force/demo-bigdata.html))
## Dependencies

 * Cytoscape.js ^3.2.0
 * <List your dependencies here please>


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-d3-force`,
 * via bower: `bower install cytoscape-d3-force`, or
 * via direct download in the repository (probably from a tag).

Import the library as appropriate for your project:

ES import:

```js
import cytoscape from 'cytoscape';
import d3Force from 'cytoscape-d3-force';

cytoscape.use( d3Force );
```

CommonJS require:

```js
let cytoscape = require('cytoscape');
let d3Force = require('cytoscape-d3-force');

cytoscape.use( d3Force ); // register extension
```

AMD:

```js
require(['cytoscape', 'cytoscape-d3-force'], function( cytoscape, d3Force ){
  d3Force( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## API

```javascript
{
  animate: true, // whether to show the layout as it's running; special 'end' value makes the layout animate like a discrete layout
  maxIterations: 0, // max iterations before the layout will bail out
  maxSimulationTime: 0, // max length in ms to run the layout
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
  fixedAfterDragging: false, // fixed node after dragging
  fit: false, // on every layout reposition of nodes, fit the viewport
  padding: 30, // padding around the simulation
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  /**d3-force API**/
  alpha: 1, // sets the current alpha to the specified number in the range [0,1]
  alphaMin: 0.001, // sets the minimum alpha to the specified number in the range [0,1]
  alphaDecay: 1 - Math.pow(0.001, 1 / 300), // sets the alpha decay rate to the specified number in the range [0,1]
  alphaTarget: 0, // sets the current target alpha to the specified number in the range [0,1]
  velocityDecay: 0.4, // sets the velocity decay factor to the specified number in the range [0,1]
  collideRadius: 1, // sets the radius accessor to the specified number or function
  collideStrength: 0.7, // sets the force strength to the specified number in the range [0,1]
  collideIterations: 1, // sets the number of iterations per application to the specified number
  linkId: function id(d) {
    return d.index;
  }, // sets the node id accessor to the specified function
  linkDistance: 30, // sets the distance accessor to the specified number or function
  linkStrength: function strength(link) {
    return 1 / Math.min(count(link.source), count(link.target));
  }, // sets the strength accessor to the specified number or function
  linkIterations: 1, // sets the number of iterations per application to the specified number
  manyBodyStrength: -30, // sets the strength accessor to the specified number or function
  manyBodyTheta: 0.9, // sets the Barnes–Hut approximation criterion to the specified number
  manyBodyDistanceMin: 1, // sets the minimum distance between nodes over which this force is considered
  manyBodyDistanceMax: Infinity, // sets the maximum distance between nodes over which this force is considered
  xStrength: 0.1, // sets the strength accessor to the specified number or function
  xX: 0, // sets the x-coordinate accessor to the specified number or function
  yStrength: 0.1, // sets the strength accessor to the specified number or function
  yY: 0, // sets the y-coordinate accessor to the specified number or function
  radialStrength: 0.1, // sets the strength accessor to the specified number or function
  radialRadius: [radius]// sets the circle radius to the specified number or function
  radialX: 0, // sets the x-coordinate of the circle center to the specified number
  radialY: 0, // sets the y-coordinate of the circle center to the specified number
  // layout event callbacks
  ready: function(){}, // on layoutready
  stop: function(){}, // on layoutstop
  tick: function(progress) {}, // on every iteration
  // positioning options
  randomize: false, // use random node positions at beginning of layout
  // infinite layout options
  infinite: false // overrides all other options for a forces-all-the-time mode
}
```


## Build targets

* `npm run test` : Run Mocha tests in `./test`
* `npm run build` : Build `./src/**` into `cytoscape-d3-force.js`
* `npm run watch` : Automatically build on changes with live reloading (N.b. you must already have an HTTP server running)
* `npm run dev` : Automatically build on changes with live reloading with webpack dev server
* `npm run lint` : Run eslint on the source

N.b. all builds use babel, so modern ES features can be used in the `src`.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Build the extension : `npm run build:release`
1. Commit the build : `git commit -am "Build for release"`
1. Bump the version number and tag: `npm version major|minor|patch`
1. Push to origin: `git push && git push --tags`
1. Publish to npm: `npm publish .`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-d3-force https://github.com/shichuanpo/cytoscape.js-d3-force.git`
1. [Make a new release](https://github.com/shichuanpo/cytoscape.js-d3-force/releases/new) for Zenodo.
