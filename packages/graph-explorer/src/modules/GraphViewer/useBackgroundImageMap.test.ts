// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VertexStyle } from "@/core";

import { createVertexType } from "@/core/entities/vertex";
import { iconRegistry } from "@/core/icons";
import { ICON_BOX, ICON_RATIO } from "@/core/icons/iconGeometry";
import { createRandomVertexStyle, renderHookWithState } from "@/utils/testing";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const REMOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>`;

function makeConfig(icon: Partial<VertexStyle>): VertexStyle {
  const base = createRandomVertexStyle();
  return { ...base, ...icon };
}

function renderMap(vtConfigs: VertexStyle[]) {
  return renderHookWithState(() => useBackgroundImageMap(vtConfigs));
}

/**
 * The wrapper nests the icon as its own data uri, so the icon's markup is
 * encoded twice. Safe for these fixtures: base64 and our test svgs contain no
 * literal `%`.
 */
function decodeIcon(url: string): string {
  return decodeURIComponent(decodeURIComponent(url));
}

describe("useBackgroundImageMap", () => {
  beforeEach(() => {
    iconRegistry.reset();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(REMOTE_SVG))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty map when given no configs", async () => {
    const { result } = renderMap([]);
    await waitFor(() => expect(result.current.size).toBe(0));
  });

  // A stored icon url is not guaranteed to be well-formed UTF-16 (a lone
  // surrogate, say). `encodeURIComponent` throws `URIError` on one, and this
  // hook runs during style computation, so an uncaught throw here takes down
  // the whole app through the route-level error boundary with no in-app way
  // back to fix the value. The vertex must render with no background image
  // instead.
  it("omits an icon whose url is not well-formed UTF-16 instead of throwing", async () => {
    const config = makeConfig({
      type: createVertexType("Malformed"),
      iconUrl: "data:image/png;base64,AAA\uD800BBB",
      iconImageType: "image/png",
    });

    let result: ReturnType<typeof renderMap>["result"];
    expect(() => {
      ({ result } = renderMap([config]));
    }).not.toThrow();

    await waitFor(() => expect(result!.current.size).toBe(0));
  });

  // Issue #2108: cytoscape cannot both preserve an image's aspect ratio and
  // inset it, so the inset is baked into a square svg wrapper and the nested
  // `preserveAspectRatio` does the fitting. That works for every icon kind
  // without measuring anything, so a raster is wrapped just like an svg.
  it("wraps a raster icon in a padded square svg", async () => {
    const config = makeConfig({
      type: createVertexType("Raster"),
      iconUrl: "https://example.test/a.png",
      iconImageType: "image/png",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("Raster"))).toBe(true),
    );
    const url = result.current.get(createVertexType("Raster"))!;
    expect(url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    const wrapper = decodeURIComponent(url);
    expect(wrapper).toContain(`viewBox="0 0 ${ICON_BOX} ${ICON_BOX}"`);
    expect(wrapper).toContain('preserveAspectRatio="xMidYMid meet"');
    // Inset the icon needs for the ellipse shape, computed from the same
    // constants VertexSymbol's preview box uses, so this also guards the two
    // staying in sync.
    const size = ICON_BOX * ICON_RATIO;
    const offset = (ICON_BOX - size) / 2;
    expect(wrapper).toContain(`x="${offset}"`);
    expect(wrapper).toContain(`y="${offset}"`);
    expect(wrapper).toContain(`width="${size}"`);
    expect(wrapper).toContain(`height="${size}"`);
    expect(decodeIcon(url)).toContain("https://example.test/a.png");
    expect(fetch).not.toBeCalled();
  });

  // Issue #2108, the case the wrapper alone does not solve: without a viewBox
  // the nested image has no intrinsic ratio for `preserveAspectRatio` to fit,
  // so it fills the padded box and comes out square — the original bug. A
  // synthesized viewBox is what keeps a plain `<svg width height>` export,
  // which is exactly what many icon exporters produce, from being squashed.
  it("carries a synthesized viewBox for an svg that declares only width and height", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="100"/></svg>`,
          ),
        ),
      ),
    );

    const config = makeConfig({
      type: createVertexType("NoViewBox"),
      iconUrl: "https://example.test/wide.svg",
      iconImageType: "image/svg+xml",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("NoViewBox"))).toBe(true),
    );
    expect(
      decodeIcon(result.current.get(createVertexType("NoViewBox"))!),
    ).toContain('viewBox="0 0 400 100"');
  });

  // Same fix, the other axis: a tall icon must synthesize a viewBox that
  // keeps height as the dominant dimension, not just width.
  it("carries a synthesized viewBox for a tall svg that declares only width and height", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            `<svg width="100" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="400"/></svg>`,
          ),
        ),
      ),
    );

    const config = makeConfig({
      type: createVertexType("TallNoViewBox"),
      iconUrl: "https://example.test/tall.svg",
      iconImageType: "image/svg+xml",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("TallNoViewBox"))).toBe(true),
    );
    expect(
      decodeIcon(result.current.get(createVertexType("TallNoViewBox"))!),
    ).toContain('viewBox="0 0 100 400"');
  });

  // The (icon, color) render cache is keyed by concatenation, so the separator
  // must be a character that cannot occur in either half. An IconSourceId
  // embeds the user-supplied icon url verbatim, and the color is an
  // unvalidated string, so a printable separator like "|" lets two distinct
  // pairs produce one key and swap icons between vertex types.
  it("does not collide when a separator character appears in the icon url and color", async () => {
    const shared = makeConfig({
      type: createVertexType("PipeInColor"),
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
      color: "x|#FF0000",
    });
    const shifted = makeConfig({
      type: createVertexType("PipeInUrl"),
      iconUrl: "https://example.test/a.svg|x",
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });

    const { result } = renderMap([shared, shifted]);

    await waitFor(() => expect(result.current.size).toBe(2));
    const second = decodeIcon(
      result.current.get(createVertexType("PipeInUrl"))!,
    );
    expect(second).toContain("color:#FF0000");
    expect(second).not.toContain("color:x|#FF0000");
  });

  it("styles a fetched svg into a data uri", async () => {
    const config = makeConfig({
      type: createVertexType("Svg"),
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("Svg"))).toBe(true),
    );
    const url = result.current.get(createVertexType("Svg"))!;
    expect(url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeIcon(url)).toContain("color:#FF0000");
  });

  it("styles a lucide icon into a data uri carrying the node color", async () => {
    const config = makeConfig({
      type: createVertexType("Lucide"),
      iconUrl: "lucide:user",
      iconImageType: "image/svg+xml",
      color: "#00FF00",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("Lucide"))).toBe(true),
    );
    const url = result.current.get(createVertexType("Lucide"))!;
    expect(url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeIcon(url)).toContain("color:#00FF00");
  });

  it("omits configs with no icon and unresolvable icons", async () => {
    const none = makeConfig({ type: createVertexType("None"), iconUrl: "" });
    const unknownLucide = makeConfig({
      type: createVertexType("Unknown"),
      iconUrl: "lucide:not-a-real-icon-name-xyz",
      iconImageType: "image/svg+xml",
    });
    const raster = makeConfig({
      type: createVertexType("Raster"),
      iconUrl: "https://example.test/a.png",
      iconImageType: "image/png",
    });

    const { result } = renderMap([none, unknownLucide, raster]);

    await waitFor(() =>
      expect(result.current.has(createVertexType("Raster"))).toBe(true),
    );
    expect(result.current.has(createVertexType("None"))).toBe(false);
    expect(result.current.has(createVertexType("Unknown"))).toBe(false);
    expect(result.current.size).toBe(1);
  });

  it("renders one icon in two colors for two vertex types", async () => {
    const red = makeConfig({
      type: createVertexType("Red"),
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });
    const blue = makeConfig({
      type: createVertexType("Blue"),
      iconUrl: "https://example.test/a.svg",
      iconImageType: "image/svg+xml",
      color: "#0000FF",
    });

    const { result } = renderMap([red, blue]);

    await waitFor(() => expect(result.current.size).toBe(2));
    expect(decodeIcon(result.current.get(createVertexType("Red"))!)).toContain(
      "color:#FF0000",
    );
    expect(decodeIcon(result.current.get(createVertexType("Blue"))!)).toContain(
      "color:#0000FF",
    );
    // One icon identity, so one fetch — color is applied by a pure transform.
    expect(fetch).toBeCalledTimes(1);
  });

  // Fan-out regression guard: many vertex types sharing a small icon pool must
  // do the async work once per UNIQUE ICON, not once per vertex type. A prior
  // implementation created one query (and one observer) per vertex type, which
  // locked up the schema view at ~10k types.
  it("resolves the whole vertex set with one fetch per unique icon", async () => {
    const iconPool: Array<Partial<VertexStyle>> = [
      { iconUrl: "lucide:plane", iconImageType: "image/svg+xml" },
      { iconUrl: "lucide:user", iconImageType: "image/svg+xml" },
      { iconUrl: "https://example.test/a.svg", iconImageType: "image/svg+xml" },
      { iconUrl: "https://example.test/b.svg", iconImageType: "image/svg+xml" },
      { iconUrl: "https://example.test/a.png", iconImageType: "image/png" },
      { iconUrl: "", iconImageType: "image/svg+xml" },
    ];
    const colorPool = ["#128EE5", "#FF0000", "#00FF00"];

    const configs: VertexStyle[] = [];
    for (let i = 0; i < 500; i++) {
      configs.push(
        makeConfig({
          type: createVertexType(`Type_${i}`),
          color: colorPool[i % colorPool.length],
          ...iconPool[i % iconPool.length],
        }),
      );
    }
    const expectedResolvable = configs.filter(c => c.iconUrl).length;

    const { result } = renderMap(configs);

    await waitFor(() => expect(result.current.size).toBe(expectedResolvable));

    // Two distinct remote svgs in the pool; everything else needs no network.
    expect(fetch).toBeCalledTimes(2);
    expect(iconRegistry.getSnapshot().size).toBe(5);
  });
});
