"use strict";

(function () {
	// registers the extension on a cytoscape lib ref
	var register = function register(cytoscape) {
		if (!cytoscape) {
			return;
		}

		var cyCanvas = function cyCanvas(args) {
			var cy = this;
			var container = cy.container();

			var canvas = document.createElement("canvas");

			container.appendChild(canvas);

			var defaults = {
				zIndex: 1,
				pixelRatio: "auto"
			};

			var options = Object.assign({}, defaults, args);

			if (options.pixelRatio === "auto") {
				options.pixelRatio = window.devicePixelRatio || 1;
			}

			function resize() {
				var width = container.offsetWidth;
				var height = container.offsetHeight;

				var canvasWidth = width * options.pixelRatio;
				var canvasHeight = height * options.pixelRatio;

				canvas.width = canvasWidth;
				canvas.height = canvasHeight;

				canvas.style.width = width + "px";
				canvas.style.height = height + "px";

				cy.trigger("cyCanvas.resize");
			}

			cy.on("resize", function () {
				resize();
			});

			canvas.setAttribute("style", "position:absolute; top:0; left:0; z-index:" + options.zIndex + ";");

			resize();

			return {
				/**
     * @return {Canvas} The generated canvas
     */
				getCanvas: function getCanvas() {
					return canvas;
				},

				/**
     * Helper: Clear the canvas
     * @param {CanvasRenderingContext2D} ctx
     */
				clear: function clear(ctx) {
					var width = cy.width();
					var height = cy.height();
					ctx.save();
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.clearRect(0, 0, width * options.pixelRatio, height * options.pixelRatio);
					ctx.restore();
				},

				/**
     * Helper: Reset the context transform to an identity matrix
     * @param {CanvasRenderingContext2D} ctx
     */
				resetTransform: function resetTransform(ctx) {
					ctx.setTransform(1, 0, 0, 1, 0, 0);
				},

				/**
     * Helper: Set the context transform to match Cystoscape's zoom & pan
     * @param {CanvasRenderingContext2D} ctx
     */
				setTransform: function setTransform(ctx) {
					var pan = cy.pan();
					var zoom = cy.zoom();
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.translate(pan.x * options.pixelRatio, pan.y * options.pixelRatio);
					ctx.scale(zoom * options.pixelRatio, zoom * options.pixelRatio);
				}
			};
		};

		cytoscape("core", "cyCanvas", cyCanvas);
	};

	if (typeof module !== "undefined" && module.exports) {
		// expose as a commonjs module
		module.exports = function (cytoscape) {
			register(cytoscape);
		};
	}

	if (typeof define !== "undefined" && define.amd) {
		// expose as an amd/requirejs module
		define("cytoscape-canvas", function () {
			return register;
		});
	}

	if (typeof cytoscape !== "undefined") {
		// expose to global cytoscape (i.e. window.cytoscape)
		register(cytoscape);
	}
})();