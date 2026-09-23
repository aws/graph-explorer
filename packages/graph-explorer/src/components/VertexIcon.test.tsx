// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  appDefaultVertexStyle,
  createVertexType,
  type VertexStyle,
} from "@/core";

import VertexIcon from "./VertexIcon";

function renderIcon(overrides: Partial<VertexStyle>) {
  const vertexStyle: VertexStyle = {
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    ...overrides,
  };
  return render(<VertexIcon vertexStyle={vertexStyle} />).container;
}

describe("VertexIcon", () => {
  // The one thing this branch changed here (issue #2108): without
  // object-contain, object-fit's default is `fill`, which stretches a
  // non-square raster to the fixed size-6 box instead of scaling it.
  it("renders a raster icon with object-contain so it scales instead of stretching", () => {
    const container = renderIcon({
      iconUrl: "https://example.test/wide.png",
      iconImageType: "image/png",
    });

    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.className).toContain("object-contain");
    expect(img!.getAttribute("src")).toBe("https://example.test/wide.png");
  });

  it("renders a lucide icon inline so it inherits the vertex color", async () => {
    const container = renderIcon({
      iconUrl: "lucide:plane",
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });

    await waitFor(() => expect(container.querySelector("svg")).toBeTruthy());
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
    expect((icon as SVGElement).style.color).toBe("rgb(255, 0, 0)");
    // Live DOM, not an <img>/<image> — this is the inline-DOM surface.
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders nothing for an unknown lucide reference", () => {
    const container = renderIcon({
      iconUrl: "lucide:not-a-real-icon-name-xyz",
      iconImageType: "image/svg+xml",
    });

    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
