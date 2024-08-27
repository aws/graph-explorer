// @vitest-environment jsdom

// DEV NOTE: The DOMParser in happy-dom is not fully functional. Using jsdom until it works properly.

import { createRandomName, createRandomColor } from "@shared/utils/testing";
import { ICONS_CACHE, VertexIconConfig, renderNode } from "./renderNode";
import { vi } from "vitest";

const fetchMock = vi.fn<typeof fetch>();

const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("renderNode", () => {
  beforeEach(() => {
    ICONS_CACHE.clear();
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("console", consoleMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return undefined given no icon url", async () => {
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: undefined,
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(result).toBeUndefined();
    expect(fetchMock).not.toBeCalled();
    expect(ICONS_CACHE.size).toEqual(0);
  });

  it("should return undefined when error occurs in fetch", async () => {
    fetchMock.mockRejectedValue(new Error("Failed"));
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: createRandomName("iconUrl"),
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(fetchMock).toBeCalledWith(node.iconUrl);
    expect(result).toBeUndefined();
    expect(ICONS_CACHE.size).toEqual(0);
    expect(consoleMock.error).toHaveBeenCalledOnce();
  });

  it("should return icon url given image type is not an SVG", async () => {
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: createRandomName("iconUrl"),
      iconImageType: "image/png",
    };

    const result = await renderNode(node);

    expect(result).toBe(node.iconUrl);
    expect(fetchMock).not.toBeCalled();
    expect(ICONS_CACHE.size).toEqual(0);
  });

  it("should return processed SVG string keeping original color", async () => {
    const originalColor = createRandomColor();
    const svgContent = `<svg fill="${originalColor}" xmlns="http://www.w3.org/2000/svg"/>`;
    fetchMock.mockResolvedValue(new Response(svgContent));
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: createRandomName("iconUrl"),
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(fetchMock).toBeCalledWith(node.iconUrl);
    expect(result).toBeDefined();
    expect(result?.slice(0, 24)).toEqual("data:image/svg+xml;utf8,");
    const decodedResult = decodeSvg(result);
    expect(decodedResult).toEqual(
      wrapExpectedSvg(
        `<svg fill="${originalColor}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"/>`
      )
    );
  });

  it("should return processed SVG string replacing currentColor with default color when custom color not provided", async () => {
    const svgContent = `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg"/>`;
    fetchMock.mockResolvedValue(new Response(svgContent));
    const iconUrl = createRandomName("iconUrl");
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: undefined,
      iconUrl,
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(fetchMock).toBeCalledWith(iconUrl);
    expect(result).toBeDefined();
    expect(result?.slice(0, 24)).toEqual("data:image/svg+xml;utf8,");
    const decodedResult = decodeSvg(result);
    expect(decodedResult).toEqual(
      wrapExpectedSvg(
        `<svg fill="#128EE5" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"/>`
      )
    );
  });

  it("should return processed SVG string replacing currentColor with provided custom color", async () => {
    const svgContent = `<svg fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"/>`;
    fetchMock.mockResolvedValue(new Response(svgContent));
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: createRandomName("iconUrl"),
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(fetchMock).toBeCalledWith(node.iconUrl);
    expect(result).toBeDefined();
    expect(result?.slice(0, 24)).toEqual("data:image/svg+xml;utf8,");
    const decodedResult = decodeSvg(result);
    expect(decodedResult).toEqual(
      wrapExpectedSvg(
        `<svg fill="${node.color}" stroke="${node.color}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"/>`
      )
    );
  });

  it("should return processed SVG string modifying the width and height", async () => {
    const originalColor = createRandomColor();
    const svgContent = `<svg fill="${originalColor}" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"/>`;
    fetchMock.mockResolvedValue(new Response(svgContent));
    const node: VertexIconConfig = {
      type: createRandomName("vertex"),
      color: createRandomColor(),
      iconUrl: createRandomName("iconUrl"),
      iconImageType: "image/svg+xml",
    };

    const result = await renderNode(node);

    expect(fetchMock).toBeCalledWith(node.iconUrl);
    expect(result).toBeDefined();
    expect(result?.slice(0, 24)).toEqual("data:image/svg+xml;utf8,");
    const decodedResult = decodeSvg(result);
    expect(decodedResult).toEqual(
      wrapExpectedSvg(
        `<svg fill="${originalColor}" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"/>`
      )
    );
  });
});

/** Wraps SVG string in another SVG element matching what is expected.  */
function wrapExpectedSvg(svgContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
  ${svgContent}
</svg>`;
}

/** Decodes the string and removes the data type URL prefix, returning only the SVG portion. */
function decodeSvg(result: string | undefined) {
  return decodeURIComponent(result!).replace("data:image/svg+xml;utf8,", "");
}
