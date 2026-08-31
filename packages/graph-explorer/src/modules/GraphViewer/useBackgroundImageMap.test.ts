// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VertexStyle } from "@/core";

import { createVertexType } from "@/core/entities/vertex";
import { iconRegistry } from "@/core/icons";
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

  it("passes raster icons through untouched", async () => {
    const config = makeConfig({
      type: createVertexType("Raster"),
      iconUrl: "https://example.test/a.png",
      iconImageType: "image/png",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.get(createVertexType("Raster"))?.url).toBe(
        "https://example.test/a.png",
      ),
    );
    expect(fetch).not.toBeCalled();
  });

  // Issue #2108: a non-square raster (not just SVG) must keep its aspect
  // ratio too. setupTests.ts's global Image double always measures 24x24, so
  // this overrides it for one test to prove a real wide/tall raster result.
  it("computes aspect-ratio-preserving dimensions for a non-square raster", async () => {
    class WideImage {
      onload: (() => void) | null = null;
      naturalWidth = 400;
      naturalHeight = 100;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", WideImage);

    const config = makeConfig({
      type: createVertexType("WideRaster"),
      iconUrl: "https://example.test/wide.png",
      iconImageType: "image/png",
    });

    const { result } = renderMap([config]);

    await waitFor(() =>
      expect(result.current.get(createVertexType("WideRaster"))).toMatchObject({
        width: "60%",
        height: "15.0%",
      }),
    );
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
    const imageData = result.current.get(createVertexType("Svg"))!;
    expect(imageData.url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(imageData.url)).toContain("color:#FF0000");
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
    const imageData = result.current.get(createVertexType("Lucide"))!;
    expect(imageData.url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(imageData.url)).toContain("color:#00FF00");
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
    expect(
      decodeURIComponent(result.current.get(createVertexType("Red"))!.url),
    ).toContain("color:#FF0000");
    expect(
      decodeURIComponent(result.current.get(createVertexType("Blue"))!.url),
    ).toContain("color:#0000FF");
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
