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

  // Not a try/catch case: DOMParser with "application/xml" never throws, it
  // returns a document whose root is <html> (wrapping a <parsererror>) or
  // whatever mismatched tag the input actually closed. Either way the root's
  // localName is not "svg", so the ordinary guard above rejects it.
  it("leaves non-svg or unparseable input untouched", () => {
    expect(ensureSvgViewBox("not xml at all <<<")).toBe("not xml at all <<<");
    expect(ensureSvgViewBox("<a><b></a>")).toBe("<a><b></a>");
  });

  // A non-finite width/height would synthesize viewBox="0 0 Infinity
  // Infinity", which blanks the icon instead of scaling it.
  it("leaves the svg untouched when width overflows to Infinity", () => {
    const svg = `<svg width="1e400" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(ensureSvgViewBox(svg)).toBe(svg);
  });

  // A percentage has no meaning without a viewport to resolve against, so
  // parseFloat's unitless "100" from "100%" would produce a bogus viewBox
  // that crops the artwork instead of scaling it.
  it("leaves the svg untouched when width/height are percentages", () => {
    const svg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="50"/></svg>`;

    expect(ensureSvgViewBox(svg)).toBe(svg);
  });

  // A plain unit suffix is legitimate SVG and must still synthesize a viewBox.
  it("synthesizes a viewBox when width/height carry a px suffix", () => {
    const svg = `<svg width="400px" height="100px" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(ensureSvgViewBox(svg)).toContain('viewBox="0 0 400 100"');
  });
});
