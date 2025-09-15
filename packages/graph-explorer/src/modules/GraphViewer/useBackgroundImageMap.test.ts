import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import { waitFor } from "@testing-library/react";
import { useBackgroundImageMap } from "./useBackgroundImageMap";
import { renderNode } from "./renderNode";
import {
  renderHookWithState,
  DbState,
  createRandomVertexTypeConfig,
} from "@/utils/testing";

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
      dbState
    );

    expect(result.current).toEqual(new Map());
  });

  it("should generate background image map for single vertex config", async () => {
    const vertexConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    const expectedImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    mockRenderNode.mockResolvedValue(expectedImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(expectedImage);
    });

    expect(mockRenderNode).toHaveBeenCalledWith(
      expect.any(Object),
      vertexConfig
    );
  });

  it("should generate background image map for multiple vertex configs", async () => {
    const personConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    const companyConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
    };

    const personImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    const companyImage = "data:image/svg+xml;utf8,<svg>company</svg>";

    mockRenderNode
      .mockResolvedValueOnce(personImage)
      .mockResolvedValueOnce(companyImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([personConfig, companyConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(personImage);
      expect(result.current.get("Company")).toBe(companyImage);
    });

    expect(mockRenderNode).toHaveBeenCalledTimes(2);
    expect(mockRenderNode).toHaveBeenCalledWith(
      expect.any(Object),
      personConfig
    );
    expect(mockRenderNode).toHaveBeenCalledWith(
      expect.any(Object),
      companyConfig
    );
  });

  it("should filter out failed renders from the map", async () => {
    const personConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    const companyConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
    };

    const personImage = "data:image/svg+xml;utf8,<svg>person</svg>";

    mockRenderNode
      .mockResolvedValueOnce(personImage)
      .mockResolvedValueOnce(null); // Failed render

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([personConfig, companyConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(personImage);
      expect(result.current.has("Company")).toBe(false);
      expect(result.current.size).toBe(1);
    });
  });

  it("should handle renderNode returning undefined", async () => {
    const vertexConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    mockRenderNode.mockResolvedValue(undefined);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.has("Person")).toBe(false);
      expect(result.current.size).toBe(0);
    });
  });

  it("should handle renderNode throwing an error", async () => {
    const vertexConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    mockRenderNode.mockRejectedValue(new Error("Render failed"));

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([vertexConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.has("Person")).toBe(false);
      expect(result.current.size).toBe(0);
    });
  });

  it("should update map when vertex configs change", async () => {
    const initialConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    const updatedConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
    };

    const personImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    const companyImage = "data:image/svg+xml;utf8,<svg>company</svg>";

    // Test initial render
    mockRenderNode.mockResolvedValueOnce(personImage);

    const { result: initialResult } = renderHookWithState(
      () => useBackgroundImageMap([initialConfig]),
      dbState
    );

    await waitFor(() => {
      expect(initialResult.current.get("Person")).toBe(personImage);
    });

    // Test updated render with different config
    mockRenderNode.mockResolvedValueOnce(companyImage);

    const { result: updatedResult } = renderHookWithState(
      () => useBackgroundImageMap([updatedConfig]),
      dbState
    );

    await waitFor(() => {
      expect(updatedResult.current.get("Company")).toBe(companyImage);
      expect(updatedResult.current.has("Person")).toBe(false);
    });
  });

  it("should handle mixed success and failure renders", async () => {
    const configs = [
      { ...createRandomVertexTypeConfig(), type: "Person" },
      { ...createRandomVertexTypeConfig(), type: "Company" },
      { ...createRandomVertexTypeConfig(), type: "Product" },
    ];

    const personImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    const productImage = "data:image/svg+xml;utf8,<svg>product</svg>";

    mockRenderNode
      .mockResolvedValueOnce(personImage)
      .mockResolvedValueOnce(null) // Company fails
      .mockResolvedValueOnce(productImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap(configs),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(personImage);
      expect(result.current.get("Product")).toBe(productImage);
      expect(result.current.has("Company")).toBe(false);
      expect(result.current.size).toBe(2);
    });
  });

  it("should use correct query key for caching", async () => {
    const vertexConfig = { ...createRandomVertexTypeConfig(), type: "Person" };
    mockRenderNode.mockResolvedValue("data:image/svg+xml;utf8,<svg></svg>");

    renderHookWithState(() => useBackgroundImageMap([vertexConfig]), dbState);

    await waitFor(() => {
      expect(mockRenderNode).toHaveBeenCalledWith(
        expect.any(Object),
        vertexConfig
      );
    });

    // Verify the query client was passed correctly
    const queryClient = mockRenderNode.mock.calls[0][0];
    expect(queryClient).toBeDefined();
  });

  it("should handle vertex configs with different image types", async () => {
    const svgConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
      iconImageType: "image/svg+xml",
    };
    const pngConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
      iconImageType: "image/png",
    };

    const svgImage = "data:image/svg+xml;utf8,<svg>person</svg>";
    const pngImage = "https://example.com/company.png";

    mockRenderNode
      .mockResolvedValueOnce(svgImage)
      .mockResolvedValueOnce(pngImage);

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([svgConfig, pngConfig]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(svgImage);
      expect(result.current.get("Company")).toBe(pngImage);
    });
  });

  it("should handle vertex configs with no icon URL", async () => {
    const configWithIcon = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
      iconUrl: "https://example.com/icon.svg",
    };
    const configWithoutIcon = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
      iconUrl: undefined,
    };

    const personImage = "data:image/svg+xml;utf8,<svg>person</svg>";

    mockRenderNode
      .mockResolvedValueOnce(personImage)
      .mockResolvedValueOnce(null); // No icon URL returns null

    const { result } = renderHookWithState(
      () => useBackgroundImageMap([configWithIcon, configWithoutIcon]),
      dbState
    );

    await waitFor(() => {
      expect(result.current.get("Person")).toBe(personImage);
      expect(result.current.has("Company")).toBe(false);
      expect(result.current.size).toBe(1);
    });
  });
});
