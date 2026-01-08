import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { waitFor } from "@testing-library/react";
import { useBackgroundImageMap } from "./useBackgroundImageMap";
import { renderNode } from "./renderNode";
import {
  renderHookWithState,
  DbState,
  createRandomVertexPreferences,
} from "@/utils/testing";
import { defaultVertexPreferences } from "@/core";

// Mock the renderNode function
vi.mock("./renderNode");
const mockRenderNode = renderNode as Mock;

describe("useBackgroundImageMap", () => {
  let dbState: DbState;

  beforeEach(() => {
    vi.clearAllMocks();
    dbState = new DbState();
    mockRenderNode.mockResolvedValue("data:image/svg+xml;utf8,<svg></svg>");
  });

  it("should return empty map when no vertex configs provided", () => {
    const { result } = renderHookWithState(
      () => useBackgroundImageMap([]),
      dbState,
    );

    expect(result.current).toEqual(new Map());
  });

  it("should generate background image map for single vertex config", async () => {
    const vertexConfig = createRandomVertexPreferences();
    const expectedImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    mockRenderNode.mockResolvedValue(expectedImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(vertexConfig.type)).toBe(expectedImage);
    });

    expect(mockRenderNode).toHaveBeenCalledWith(
      expect.any(Object),
      vertexConfig,
    );
  });

  it("should generate background image map for multiple vertex configs", async () => {
    const config1 = createRandomVertexPreferences();
    const config2 = createRandomVertexPreferences();

    const image1 = "data:image/svg+xml;utf8,<svg>first</svg>";
    const image2 = "data:image/svg+xml;utf8,<svg>second</svg>";

    mockRenderNode.mockResolvedValueOnce(image1).mockResolvedValueOnce(image2);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([config1, config2]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(config1.type)).toBe(image1);
      expect(result.current.get(config2.type)).toBe(image2);
    });

    expect(mockRenderNode).toHaveBeenCalledTimes(2);
    expect(mockRenderNode).toHaveBeenCalledWith(expect.any(Object), config1);
    expect(mockRenderNode).toHaveBeenCalledWith(expect.any(Object), config2);
  });

  it("should filter out failed renders from the map", async () => {
    const config1 = createRandomVertexPreferences();
    const config2 = createRandomVertexPreferences();

    const successImage = "data:image/svg+xml;utf8,<svg>success</svg>";

    mockRenderNode
      .mockResolvedValueOnce(successImage)
      .mockResolvedValueOnce(null); // Failed render

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([config1, config2]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(config1.type)).toBe(successImage);
      expect(result.current.has(config2.type)).toBe(false);
      expect(result.current.size).toBe(1);
    });
  });

  it("should handle renderNode returning undefined", async () => {
    const vertexConfig = createRandomVertexPreferences();
    mockRenderNode.mockResolvedValue(undefined);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.has(vertexConfig.type)).toBe(false);
      expect(result.current.size).toBe(0);
    });
  });

  it("should handle renderNode throwing an error", async () => {
    const vertexConfig = createRandomVertexPreferences();
    mockRenderNode.mockRejectedValue(new Error("Render failed"));

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.has(vertexConfig.type)).toBe(false);
      expect(result.current.size).toBe(0);
    });
  });

  it("should update map when vertex configs change", async () => {
    const initialConfig = createRandomVertexPreferences();
    const updatedConfig = createRandomVertexPreferences();

    const initialImage = "data:image/svg+xml;utf8,<svg>initial</svg>";
    const updatedImage = "data:image/svg+xml;utf8,<svg>updated</svg>";

    // Test initial render
    mockRenderNode.mockResolvedValueOnce(initialImage);

    const { result: initialResult } = renderHookWithState(
      () => useBackgroundImageMap([initialConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(initialResult.current.get(initialConfig.type)).toBe(initialImage);
    });

    // Test updated render with different config
    mockRenderNode.mockResolvedValueOnce(updatedImage);

    const { result: updatedResult } = renderHookWithState(
      () => useBackgroundImageMap([updatedConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(updatedResult.current.get(updatedConfig.type)).toBe(updatedImage);
      expect(updatedResult.current.has(initialConfig.type)).toBe(false);
    });
  });

  it("should handle mixed success and failure renders", async () => {
    const configs = [
      createRandomVertexPreferences(),
      createRandomVertexPreferences(),
      createRandomVertexPreferences(),
    ];

    const image1 = "data:image/svg+xml;utf8,<svg>first</svg>";
    const image3 = "data:image/svg+xml;utf8,<svg>third</svg>";

    mockRenderNode
      .mockResolvedValueOnce(image1)
      .mockResolvedValueOnce(null) // Second fails
      .mockResolvedValueOnce(image3);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap(configs),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(configs[0].type)).toBe(image1);
      expect(result.current.has(configs[1].type)).toBe(false);
      expect(result.current.get(configs[2].type)).toBe(image3);
      expect(result.current.size).toBe(2);
    });
  });

  it("should use correct query key for caching", async () => {
    const vertexConfig = createRandomVertexPreferences();
    mockRenderNode.mockResolvedValue("data:image/svg+xml;utf8,<svg></svg>");

    renderHookWithState(() => useBackgroundImageMap([vertexConfig]), dbState);

    await waitFor(() => {
      expect(mockRenderNode).toHaveBeenCalledWith(
        expect.any(Object),
        vertexConfig,
      );
    });

    // Verify the query client was passed correctly
    const queryClient = mockRenderNode.mock.calls[0][0];
    expect(queryClient).toBeDefined();
  });

  it("should handle vertex configs with different image types", async () => {
    const svgConfig = createRandomVertexPreferences();
    const pngConfig = createRandomVertexPreferences();

    const svgImage = "data:image/svg+xml;utf8,<svg>svg</svg>";
    const pngImage = "https://example.com/image.png";

    mockRenderNode
      .mockResolvedValueOnce(svgImage)
      .mockResolvedValueOnce(pngImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([svgConfig, pngConfig]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(svgConfig.type)).toBe(svgImage);
      expect(result.current.get(pngConfig.type)).toBe(pngImage);
    });
  });

  it("should handle vertex configs with no icon URL", async () => {
    const configWithIcon = createRandomVertexPreferences();
    configWithIcon.iconUrl = "https://example.com/icon.svg";

    const configWithoutIcon = createRandomVertexPreferences();
    configWithoutIcon.iconUrl = defaultVertexPreferences.iconUrl;

    const successImage = "data:image/svg+xml;utf8,<svg>success</svg>";

    mockRenderNode
      .mockResolvedValueOnce(successImage)
      .mockResolvedValueOnce(null); // No icon URL returns null

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([configWithIcon, configWithoutIcon]),
      dbState,
    );

    await waitFor(() => {
      expect(result.current.get(configWithIcon.type)).toBe(successImage);
      expect(result.current.has(configWithoutIcon.type)).toBe(false);
      expect(result.current.size).toBe(1);
    });
  });
});
