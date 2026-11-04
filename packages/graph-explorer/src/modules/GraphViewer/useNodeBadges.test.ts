// @vitest-environment happy-dom
import { renderHook } from "@testing-library/react";

import {
  createRenderedVertexId,
  createVertexId,
  createVertexType,
  type RenderedVertex,
} from "@/core";

import useNodeBadges from "./useNodeBadges";

function renderBadges(zoomLevel: "small" | "medium" | "large") {
  const { result } = renderHook(() => useNodeBadges());
  const getNodeBadges = result.current(new Set());
  const nodeData: RenderedVertex["data"] = {
    id: createRenderedVertexId(createVertexId("1")),
    type: createVertexType("Person"),
    vertexId: createVertexId("1"),
    displayName: "a-very-long-vertex-display-name-value",
    displayTypes: "Person",
    neighborCount: 0,
  };
  const boundingBox = { x: 0, y: 0, width: 24, height: 24 };
  const context = {} as CanvasRenderingContext2D;

  return getNodeBadges(nodeData, boundingBox, { context, zoomLevel });
}

describe("useNodeBadges", () => {
  it("does not cap the label badge's width, so long labels are not truncated", () => {
    const [labelBadge] = renderBadges("medium");

    expect(labelBadge?.maxWidth).toBeUndefined();
  });
});
