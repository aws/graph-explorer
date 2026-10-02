// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { describe, expect, it } from "vitest";

import { ensureSvgViewBox, sanitizeSvg } from "./svgMarkup";

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

  // A percentage has no meaning without a viewport to resolve against.
  it("leaves the svg untouched when width/height are percentages", () => {
    const svg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="50"/></svg>`;

    expect(ensureSvgViewBox(svg)).toBe(svg);
  });

  // Child geometry is in user units (px); a viewBox built from em or pt
  // numbers would zoom into a corner instead of fitting.
  it.each(["2em", "72pt", "10mm", "1in", "400 px", "-5", "0"])(
    "leaves the svg untouched when width is %s",
    width => {
      const svg = `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

      expect(ensureSvgViewBox(svg)).toBe(svg);
    },
  );

  it.each([
    [" 400 ", "400"],
    ["0.5", "0.5"],
    ["4e2", "400"],
    ["400PX", "400"],
  ])("synthesizes a viewBox from a width of %j", (width, expected) => {
    const svg = `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(ensureSvgViewBox(svg)).toContain(`viewBox="0 0 ${expected} 100"`);
  });

  it("synthesizes a viewBox when width/height carry a px suffix", () => {
    const svg = `<svg width="400px" height="100px" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(ensureSvgViewBox(svg)).toContain('viewBox="0 0 400 100"');
  });
});

describe("sanitizeSvg", () => {
  it("strips a <script> element and still synthesizes a viewBox", () => {
    const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="400" height="100"/></svg>`;

    const result = sanitizeSvg(svg);

    expect(result).not.toContain("<script");
    expect(result).toContain("<rect");
    expect(result).toContain('viewBox="0 0 400 100"');
  });

  // The svg profile already allowlists width/height/viewBox, so sanitizing
  // does not strip the very attributes ensureSvgViewBox needs to read.
  it("preserves an existing viewBox through sanitization", () => {
    const svg = `<svg viewBox="0 0 300 75" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="75"/></svg>`;

    expect(sanitizeSvg(svg)).toContain('viewBox="0 0 300 75"');
  });
});
