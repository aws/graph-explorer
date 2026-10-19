// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import {
  appDefaultVertexStyle,
  createVertexType,
  type VertexStyle,
} from "@/core";
import { createSvgIconDataUrl } from "@/utils/testing";

import VertexIcon from "./VertexIcon";

/** Carries a `<circle>` so a test can detect it becoming a live element. */
const CUSTOM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><text>Café</text></svg>`;

function decodedSrc(image: HTMLElement): string {
  return decodeURIComponent(image.getAttribute("src")!);
}

// An svg, so a parent's `[&_svg]` sizing applies to it exactly as it will to
// the loaded icon; inline-block keeps its box in a non-flex parent.
function expectSizedPlaceholder(placeholder: Element) {
  expect(placeholder.tagName.toLowerCase()).toBe("svg");
  expect(placeholder).toHaveAttribute("aria-hidden", "true");
  expect(placeholder).toHaveClass("inline-block", "size-6");
}

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
  // is not observable here; this pins that a raster still renders its source,
  // on the first render, with no wait for the registry.
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

    // Not the bare `svg`, which the loading placeholder also matches.
    await waitFor(() =>
      expect(container.querySelector("svg.lucide-plane")).toBeTruthy(),
    );
    const icon = container.querySelector("svg.lucide-plane");
    expect((icon as SVGElement).style.color).toBe("rgb(255, 0, 0)");
    // Live DOM, not an <img>/<image> — this is the inline-DOM surface.
    expect(container.querySelector("img")).toBeNull();
  });

  // The markup reaches the browser only as an image source, which renders it
  // as a separate script-disabled document.
  it("renders a custom svg as an image, keeping it out of the live DOM", async () => {
    const container = renderIcon({
      iconUrl: createSvgIconDataUrl(CUSTOM_SVG),
      iconImageType: "image/svg+xml",
    });

    const image = await screen.findByRole("img", { name: "Person icon" });

    expect(image.tagName).toBe("IMG");
    expect(decodedSrc(image)).toContain("<circle");
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("circle")).toBeNull();
  });

  it("decodes non-ascii svg text as utf-8", async () => {
    renderIcon({
      iconUrl: createSvgIconDataUrl(CUSTOM_SVG),
      iconImageType: "image/svg+xml",
    });

    const image = await screen.findByRole("img", { name: "Person icon" });

    expect(decodedSrc(image)).toContain("Café");
  });

  // The image document cannot inherit CSS, so the color is baked into it.
  it("bakes the vertex color into a custom svg", async () => {
    renderIcon({
      iconUrl: createSvgIconDataUrl(CUSTOM_SVG),
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });

    const image = await screen.findByRole("img", { name: "Person icon" });

    expect(decodedSrc(image)).toContain("color:#FF0000");
  });

  it("renders the default icon in the default color", async () => {
    renderIcon({});

    const image = await screen.findByRole("img", { name: "Person icon" });

    expect(decodedSrc(image)).toContain("<svg");
    expect(decodedSrc(image)).toContain(`color:${appDefaultVertexStyle.color}`);
  });

  // The label comes from the database or an imported file, so it must reach
  // the DOM as text, never as markup.
  it("labels an svg icon with its type as plain text", async () => {
    const label = '<img src="x" alt="injected">';
    const { container } = render(
      <VertexIcon
        vertexStyle={{
          ...appDefaultVertexStyle,
          type: createVertexType(label),
        }}
      />,
    );

    expect(
      await screen.findByRole("img", { name: `${label} icon` }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  // A box of the icon's size keeps a row from shifting when the icon lands.
  it("holds the icon's space when an svg cannot be drawn", () => {
    const container = renderIcon({
      iconUrl: createSvgIconDataUrl("<html>Not an svg</html>"),
      iconImageType: "image/svg+xml",
    });

    expect(screen.queryByRole("img")).toBeNull();
    expectSizedPlaceholder(container.firstElementChild!);
  });

  // DynamicIcon renders nothing until its chunk loads, which would push a list
  // row's label right by an icon width when it lands.
  it("holds the icon's space while a lucide icon loads", async () => {
    const container = renderIcon({
      iconUrl: "lucide:plane",
      iconImageType: "image/svg+xml",
    });

    expectSizedPlaceholder(container.firstElementChild!);
    await waitFor(() =>
      expect(container.querySelector("svg.lucide-plane")).toBeTruthy(),
    );
  });

  it("renders nothing for an unknown lucide reference", () => {
    const container = renderIcon({
      iconUrl: "lucide:not-a-real-icon-name-xyz",
      iconImageType: "image/svg+xml",
    });

    expect(container).toBeEmptyDOMElement();
  });
});
