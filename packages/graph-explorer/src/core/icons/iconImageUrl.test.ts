// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { describe, expect, it } from "vitest";

import { toIconImageUrl } from "./iconImageUrl";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>`;

function decode(dataUri: string): string {
  return decodeURIComponent(dataUri.replace("data:image/svg+xml;utf8,", ""));
}

describe("toIconImageUrl", () => {
  it("passes a raster icon through as its url", () => {
    expect(
      toIconImageUrl(
        { kind: "raster", url: "https://example.test/a.png" },
        "#FF0000",
      ),
    ).toBe("https://example.test/a.png");
  });

  it("encodes an svg icon as a data uri", () => {
    const result = toIconImageUrl({ kind: "svg", svg: SVG }, "#FF0000");

    expect(result.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decode(result)).toContain("<path");
  });

  it("sizes the svg to the cytoscape node size", () => {
    const result = toIconImageUrl({ kind: "svg", svg: SVG }, "#FF0000");

    expect(decode(result)).toContain('width="24"');
    expect(decode(result)).toContain('height="24"');
  });

  // The color reaches a currentColor-authored icon through CSS inheritance, so
  // hardcoded fills are deliberately left alone (issue #2105).
  it("sets the root color so currentColor follows the vertex color", () => {
    const result = toIconImageUrl({ kind: "svg", svg: SVG }, "#FF0000");

    expect(decode(result)).toContain("color:#FF0000");
  });

  // Ported from the deleted renderNode.test.ts. Recoloring is inheritance-only,
  // so an icon that hardcodes its colors keeps them — the deliberate behavior
  // tracked as issue #2105.
  it("leaves a hardcoded fill untouched", () => {
    const result = toIconImageUrl(
      {
        kind: "svg",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="#ABCDEF"><path d="M0 0h1v1H0z"/></svg>`,
      },
      "#FF0000",
    );

    expect(decode(result)).toContain('fill="#ABCDEF"');
    expect(decode(result)).toContain("color:#FF0000");
  });

  // The previous implementation text-replaced every "currentColor" with the
  // vertex color. It must survive now so CSS inheritance does the work.
  it("keeps currentColor rather than substituting the vertex color for it", () => {
    const result = toIconImageUrl(
      {
        kind: "svg",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor"/>`,
      },
      "#FF0000",
    );

    expect(decode(result)).toContain("currentColor");
    expect(decode(result)).toContain("color:#FF0000");
  });

  // The cytoscape SVG wrapper these used to be embedded in was dropped after
  // confirming data uris render without it.
  it("emits no xml prolog or doctype", () => {
    const result = toIconImageUrl({ kind: "svg", svg: SVG }, "#FF0000");

    expect(decode(result)).not.toContain("<?xml");
    expect(decode(result)).not.toContain("<!DOCTYPE");
  });

  it("preserves an existing root style", () => {
    const result = toIconImageUrl(
      {
        kind: "svg",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" style="opacity:0.5"><path d="M0 0h1v1H0z"/></svg>`,
      },
      "#FF0000",
    );

    expect(decode(result)).toContain("opacity:0.5");
    expect(decode(result)).toContain("color:#FF0000");
  });

  it("renders the same icon differently per color", () => {
    const red = toIconImageUrl({ kind: "svg", svg: SVG }, "#FF0000");
    const blue = toIconImageUrl({ kind: "svg", svg: SVG }, "#0000FF");

    expect(red).not.toBe(blue);
  });

  // Issue #2108: forcing every icon's intrinsic size to a fixed 24x24 square
  // bakes a mismatched-aspect letterbox into the rasterized image, which the
  // consumer's own aspect-aware background-width/height then stretches a
  // second time — distorting a non-square icon worse than doing nothing.
  describe("non-square icons (issue #2108)", () => {
    const WIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><rect width="400" height="100"/></svg>`;
    const TALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 400"><rect width="100" height="400"/></svg>`;

    it("scales a wide icon's intrinsic width/height to its real aspect ratio", () => {
      const result = toIconImageUrl(
        { kind: "svg", svg: WIDE_SVG, width: 400, height: 100 },
        "#FF0000",
      );

      expect(decode(result)).toContain('width="24"');
      expect(decode(result)).toContain('height="6"');
    });

    it("scales a tall icon's intrinsic width/height to its real aspect ratio", () => {
      const result = toIconImageUrl(
        { kind: "svg", svg: TALL_SVG, width: 100, height: 400 },
        "#FF0000",
      );

      expect(decode(result)).toContain('width="6"');
      expect(decode(result)).toContain('height="24"');
    });

    it("falls back to a 24x24 square when dimensions are unknown", () => {
      const result = toIconImageUrl({ kind: "svg", svg: WIDE_SVG }, "#FF0000");

      expect(decode(result)).toContain('width="24"');
      expect(decode(result)).toContain('height="24"');
    });
  });
});
