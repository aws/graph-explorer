// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  appDefaultVertexStyle,
  createVertexType,
  type VertexStyle,
} from "@/core";

import { VertexSymbol } from "./VertexSymbol";

/** Carries a `<circle>` so a test can detect it becoming a live element. */
const UNTRUSTED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#000000"/></svg>`;

function renderSymbol(overrides: Partial<VertexStyle>) {
  const vertexStyle: VertexStyle = {
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    ...overrides,
  };
  render(<VertexSymbol vertexStyle={vertexStyle} />);
  return screen.getByRole("img");
}

function iconElement(root: HTMLElement): Element {
  const icon = root.querySelector("svg, image");
  if (!icon) {
    throw new Error("no icon rendered");
  }
  return icon;
}

describe("VertexSymbol", () => {
  it("renders a lucide icon inline so it inherits the vertex color", async () => {
    const root = renderSymbol({
      iconUrl: "lucide:plane",
      iconImageType: "image/svg+xml",
      color: "#FF0000",
    });

    await waitFor(() => expect(root.querySelector("svg")).toBeTruthy());
    const icon = iconElement(root);

    expect(icon.tagName.toLowerCase()).toBe("svg");
    // Inline markup plus an inherited `color` is what makes recoloring free.
    expect(icon.getAttribute("stroke")).toBe("currentColor");
    expect((icon as SVGElement).style.color).toBe("rgb(255, 0, 0)");
  });

  it("renders an untrusted svg through an image element, keeping it out of the live DOM", async () => {
    const root = renderSymbol({
      iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(UNTRUSTED_SVG)}`,
      iconImageType: "image/svg+xml",
    });

    await waitFor(() => expect(root.querySelector("image")).toBeTruthy());

    // The markup reaches the browser only as an image source, which renders it
    // as a separate script-disabled document.
    const href = root.querySelector("image")!.getAttribute("href")!;
    expect(decodeURIComponent(href)).toContain("<circle");
    // Nothing from it became a live element: no inlined svg, no circle.
    expect(root.querySelector("svg")).toBeNull();
    expect(root.querySelector("circle")).toBeNull();
  });

  // The style almost every vertex actually uses.
  it("renders the default icon", async () => {
    const root = renderSymbol({});

    await waitFor(() => expect(root.querySelector("image")).toBeTruthy());

    expect(root.querySelector("image")!.getAttribute("href")).toContain(
      "data:image/svg+xml;utf8,",
    );
  });

  it("renders nothing when the vertex style has no icon", () => {
    const root = renderSymbol({ iconUrl: "" });

    expect(root.querySelector("image")).toBeNull();
    expect(root.querySelector("svg")).toBeNull();
  });

  // Chrome renders NOTHING when clip-path sits on a nested <svg>, so the clip
  // has to be on an ancestor <g>. The failure mode is a silently invisible
  // icon, which no assertion available in jsdom would otherwise catch.
  it("clips via an ancestor group rather than the icon element", async () => {
    const root = renderSymbol({
      iconUrl: "lucide:plane",
      iconImageType: "image/svg+xml",
    });

    await waitFor(() => expect(root.querySelector("svg")).toBeTruthy());
    const icon = iconElement(root);

    expect(icon.getAttribute("clip-path")).toBeNull();
    const clippingGroup = root.querySelector("g[clip-path]");
    expect(clippingGroup).toBeTruthy();
    expect(clippingGroup!.contains(icon)).toBe(true);
  });
});
