cytoscape-canvas
================================================================================

![Preview](https://raw.githubusercontent.com/classcraft/cytoscape.js-canvas/master/preview.png)

## Description

An extension to create a canvas over or under a Cytoscape graph.
Useful for customizing nodes/edges, drawing backgrounds, etc.

## Demo

[Demo](https://codepen.io/anault/pen/dzdmKP)

## Dependencies

 * Cytoscape.js >=3.0.0

## Example

```js
var cytoscape = require('cytoscape');
var cyCanvas = require('cytoscape-canvas');

cyCanvas(cytoscape); // Register extension

var cy = cytoscape({/* ... */});

var layer = cy.cyCanvas();
var canvas = layer.getCanvas();
var ctx = canvas.getContext('2d');

cy.on("render cyCanvas.resize", function(evt) {
	layer.resetTransform(ctx);
	layer.clear(ctx);

	// Draw fixed elements
	ctx.fillRect(0, 0, 100, 100); // Top left corner

	layer.setTransform(ctx);

	// Draw model elements
	cy.nodes().forEach(function(node) {
		var pos = node.position();
		ctx.fillRect(pos.x, pos.y, 100, 100); // At node position
	});
});

```

## Usage instructions

Download the library:

 * via npm: `npm install cytoscape-canvas`,
 * via bower: `bower install cytoscape-canvas `, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:

```js
var cytoscape = require('cytoscape');
var cyCanvas = require('cytoscape-canvas');

cyCanvas(cytoscape); // Register extension
```

AMD:

```js
require(['cytoscape', 'cytoscape-canvas'], function(cytoscape, cyCanvas) {
  cyCanvas(cytoscape); // Register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.

### Initialisation

```js
var cy = cytoscape({/* ... */});

var layer = cy.cyCanvas({
  zIndex: 1,
  pixelRatio: "auto",
});
```

### API

### `layer.getCanvas()`

- return: *Canvas* The generated canvas

### `layer.setTransform(ctx)`

Set the context transform to **match Cystoscape's zoom & pan**. Further drawing will be on [model position](http://js.cytoscape.org/#notation/position).

- param: *CanvasRenderingContext2D* ctx

#### `layer.resetTransform(ctx)`

Reset the context transform. Further drawing will be on [rendered position](http://js.cytoscape.org/#notation/position).

- param: *CanvasRenderingContext2D* ctx

#### `layer.clear(ctx)`

Clear the entire canvas.

- param: *CanvasRenderingContext2D* ctx

### Events

`cyCanvas.resize`: When the extension's canvas is resized
