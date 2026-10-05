// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { describe, expect, it } from "vitest";

import { sanitizeSvg } from "./svgMarkup";

function viewBoxOf(svg: string): string | null {
  return new DOMParser()
    .parseFromString(svg, "image/svg+xml")
    .documentElement.getAttribute("viewBox");
}

describe("sanitizeSvg viewBox synthesis", () => {
  // Issue #2108: without a viewBox, an SVG has no coordinate system to scale
  // from — forcing a different width/height on the root just clips the
  // content instead of scaling it.
  it("synthesizes a viewBox from width/height when one is missing", () => {
    const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="100"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBe("0 0 400 100");
  });

  it("leaves an existing viewBox untouched", () => {
    const svg = `<svg viewBox="0 0 300 75" width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="75"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBe("0 0 300 75");
  });

  it("leaves the svg untouched when width/height are also missing", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBeNull();
  });

  // A 404 body sanitizes to something that is not SVG; consumers rely on a
  // non-null result being renderable.
  it.each([
    ["plain text", "not xml at all <<<"],
    ["an html page", "<html><body>Not Found</body></html>"],
    ["two roots", "<svg></svg><svg></svg>"],
  ])("rejects %s", (_, input) => {
    expect(sanitizeSvg(input)).toBeNull();
  });

  // A non-finite width/height would synthesize viewBox="0 0 Infinity
  // Infinity", which blanks the icon instead of scaling it.
  it("leaves the svg untouched when width overflows to Infinity", () => {
    const svg = `<svg width="1e400" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBeNull();
  });

  // A percentage has no meaning without a viewport to resolve against.
  it("leaves the svg untouched when width/height are percentages", () => {
    const svg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="50"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBeNull();
  });

  // Child geometry is in user units (px); a viewBox built from em or pt
  // numbers would zoom into a corner instead of fitting.
  it.each(["2em", "72pt", "10mm", "1in", "400 px", "-5", "0"])(
    "leaves the svg untouched when width is %s",
    width => {
      const svg = `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

      expect(viewBoxOf(sanitizeSvg(svg)!)).toBeNull();
    },
  );

  it.each([
    [" 400 ", "400"],
    ["0.5", "0.5"],
    ["4e2", "400"],
    ["400PX", "400"],
  ])("synthesizes a viewBox from a width of %j", (width, expected) => {
    const svg = `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBe(`0 0 ${expected} 100`);
  });

  it("synthesizes a viewBox when width/height carry a px suffix", () => {
    const svg = `<svg width="400px" height="100px" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;

    expect(viewBoxOf(sanitizeSvg(svg)!)).toBe("0 0 400 100");
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

  // The canvas renders this inside an XML image document, so the output must
  // parse as XML even when the input was HTML-ish.
  it("returns well-formed xml", () => {
    const result = sanitizeSvg(
      `<svg width="10" height="10"><rect width="10" height="10"></svg>`,
    )!;

    const doc = new DOMParser().parseFromString(result, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.localName).toBe("svg");
  });
});
