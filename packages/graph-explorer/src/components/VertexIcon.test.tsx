// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
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
  // jsdom never lays out elements, so the object-contain fit (issue #2108)
  // is not observable here; this pins that a raster still renders its source.
  it("renders a raster icon as an image carrying its source url", () => {
    renderIcon({
      iconUrl: "data:image/png;base64,QUJD",
      iconImageType: "image/png",
    });

    expect(screen.getByRole("img", { name: "Person icon" })).toHaveAttribute(
      "src",
      "data:image/png;base64,QUJD",
    );
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

  // The label comes from the database or an imported file, so it must reach
  // the DOM as text, never as markup.
  it("labels an inline svg icon with its type as plain text", async () => {
    const label = '<img src="x" alt="injected">';
    const { container } = render(
      <VertexIcon
        vertexStyle={{
          ...appDefaultVertexStyle,
          type: createVertexType(label),
        }}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: `${label} icon` }),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders nothing for an unknown lucide reference", () => {
    const container = renderIcon({
      iconUrl: "lucide:not-a-real-icon-name-xyz",
      iconImageType: "image/svg+xml",
    });

    expect(container).toBeEmptyDOMElement();
  });
});
