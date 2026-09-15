// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { describe, expect, it } from "vitest";

import { ensureSvgViewBox } from "./svgViewBox";

describe("ensureSvgViewBox", () => {
  // Issue #2108: without a viewBox, an SVG has no coordinate system to scale
  // from — forcing a different width/height on the root just clips the
  // content instead of scaling it.
  it("synthesizes a viewBox from width/height when one is missing", () => {
    const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="100"/></svg>`;

    expect(ensureSvgViewBox(svg)).toContain('viewBox="0 0 400 100"');
  });

  it("leaves an existing viewBox untouched", () => {
    const svg = `<svg viewBox="0 0 300 75" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="75"/></svg>`;

    expect(ensureSvgViewBox(svg)).toBe(svg);
  });

  it("leaves the svg untouched when width/height are also missing", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(ensureSvgViewBox(svg)).toBe(svg);
  });

  it("leaves non-svg or unparseable input untouched", () => {
    expect(ensureSvgViewBox("not xml at all <<<")).toBe("not xml at all <<<");
  });
});
