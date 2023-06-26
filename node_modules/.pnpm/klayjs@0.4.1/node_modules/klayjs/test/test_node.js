var assert = require("assert")

describe('node.js', function() {
  describe('klay.layout()', function() {

    // load a test graph
    var fs = require("fs");
    var klay = require("../klay.js");
    var graph = fs.readFileSync("test/graph.test", "utf8");

    // execute layout
    klay.layout({
      graph: JSON.parse(graph),
      error: console.log,
      success: function(s) {
        it('should return a valid graph', function() {
          assert.notEqual(s.id, null);
          assert.notEqual(s.width, null);
          assert.notEqual(s.height, null);
        });
      }
    });
    
  });
});