KLayJS
===

KLayJS is a layer-based layout algorithm that is particularly suited for
node-link diagrams with an inherent direction and ports 
(explicit attachment points on a node's border). It is based on the 
ideas originally introduced by Sugiyama et al. 

The algorithm is developed in Java and compiled to JavaScript using GWT. 
For further information see the KIELER [Wiki pages][wiki-klay]. 

In case you want to use the layout in conjunction with [D3.js][d3js] 
you can take a look at our [KLayJS-D3][klayjs-d3] extension.
gru

Example Layout of a Ptolemy Diagram
===
![Ptolemy Diagram](http://rtsys.informatik.uni-kiel.de/~uru/ptolemy.png)

Installation
===
Either download the `klay.js` file or install it using `npm` or `bower`.
```bash
npm install klayjs
```
```bash
bower install klayjs
```

Usage
===
The library can be used in the browser, in a WebWorker, and with server-side node.js. 

Input graph
---
We use the [JSON KGraph][jsonkgraph] format to specify a graph with its properties. 
A minimal example looks like this:
```js
var graph = {
  "id": "root",
  "properties": {
      "direction": "RIGHT", "spacing": 40
  },
  "children": [{"id": "n1", "width": 40, "height": 40}, 
               {"id": "n2", "width": 40, "height": 40}],
  "edges": [{"id": "e1", "source": "n1", "target": "n2"}]
};
```

Browser
---
Within the browser KLayJS is registered globally with the `$klay` variable 
and can be used as follows. Note the difference between _local_ layout options
specified for specific elements in the graph and _global_ layout options 
that are applied to every graph element.
```html
<script type="text/javascript" src="klayjs.js"></script>
<script>
$klay.layout({
  graph: graph,
  options: { spacing: 20 },
  success: function(layouted) { console.log(layouted); },
  error: function(error) { console.log(error); }
});
</script>
```

Web Worker
---
Depending on the graph size the layout process can take 
some time possibly freezing your browser (though it should be fast 
in most cases). Modern browsers support _web workers_, some kind of
threads for the browser. The following code snippet demonstrates
how to start and communicate with a web worker performing layout.

```js
var worker = new Worker('klayjs.js');
// send layout request
worker.postMessage({
  graph: [graph],
  options: [options]
});
// 
worker.addEventListener('message', function (e) {
  var graph = e.data;
  // [ applyLayout(graph) ]
}, false);
```

node.js
---
For rapid prototyping or headless diagram generation
no browser is required and you might want to use node.js. 

```bash
npm install klayjs
```

```js
var klay = require('klayjs');
klay.layout({
  graph: [graph],
  options: [options],
  success: function(g) { console.log(g); }
});
```

Layout Options
---
A broad variety of layout options is supported. The available options 
and their effects are discussed [here][wiki-layopts]

### Differences
- Other than for the original java version of the layouter, 
  the `layoutHierarchy` option is by default `true`.
- If you intend to use the fixed layouter (`de.cau.cs.kieler.fixed`) at some point, you
  have to set `layoutHierarchy` to `false`.

Examples 
===

Some examples using the [KLayJS-D3][klayjs-d3] extension are available at:
- [Ports](http://openkieler.github.io/klayjs-d3/examples/ports/)
- [Hierarchy](http://openkieler.github.io/klayjs-d3/examples/hierarchy/)
- [Interactive](http://openkieler.github.io/klayjs-d3/examples/interactive/)
- [Miserables](http://openkieler.github.io/klayjs-d3/examples/miserables/) (Data From D3 Force Example)

See the `examples` folder of the klayjs-d3 project.

#### SCChart with Dataflow
![SCChart with Dataflow](http://rtsys.informatik.uni-kiel.de/~uru/scchartsdataflow.png)

#### Sequentially Constructive Graph
![Sequentially Constructive Graph](http://rtsys.informatik.uni-kiel.de/~uru/scg.png)

[wiki-klay]: http://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/KLay+Layered
[wiki-layopts]: http://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/KLay+Layered+Layout+Options
[jsonkgraph]: http://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/JSON+Graph+Format
[klayjs-d3]: https://github.com/OpenKieler/klayjs-d3
[d3js]: http://d3js.org/