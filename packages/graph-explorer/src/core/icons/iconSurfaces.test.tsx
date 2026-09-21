// @vitest-environment jsdom

import { render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VertexSymbol } from "@/components/VertexSymbol/VertexSymbol";
import {
  appDefaultVertexStyle,
  createVertexType,
  type VertexStyle,
} from "@/core";
import { useBackgroundImageMap } from "@/modules/GraphViewer/useBackgroundImageMap";

import { iconRegistry } from "./iconRegistry";

const REMOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>`;
const SHARED_ICON = "https://example.test/shared.svg";

function style(overrides: Partial<VertexStyle>): VertexStyle {
  return {
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    iconUrl: SHARED_ICON,
    iconImageType: "image/svg+xml",
    ...overrides,
  };
}

describe("icon resolution across surfaces", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(REMOTE_SVG))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The DOM surface and the canvas are keyed by icon identity in one registry,
  // so the same icon is fetched once no matter how many surfaces want it.
  it("fetches a shared icon once for both the canvas and a vertex symbol", async () => {
    const canvas = renderHook(() =>
      useBackgroundImageMap([style({ type: createVertexType("A") })]),
    );
    await waitFor(() => expect(canvas.result.current.size).toBe(1));

    render(<VertexSymbol vertexStyle={style({})} />);
    await waitFor(() => expect(iconRegistry.pendingCount).toBe(0));

    expect(fetch).toBeCalledTimes(1);
  });

  // A set-shaped cache key made adding one vertex type re-resolve every icon.
  it("does not re-resolve existing icons when the vertex set grows", async () => {
    const first = [style({ type: createVertexType("A") })];
    const { result, rerender } = renderHook(
      (configs: VertexStyle[]) => useBackgroundImageMap(configs),
      { initialProps: first },
    );
    await waitFor(() => expect(result.current.size).toBe(1));
    expect(fetch).toBeCalledTimes(1);

    rerender([
      ...first,
      style({
        type: createVertexType("B"),
        iconUrl: "https://example.test/other.svg",
      }),
    ]);
    await waitFor(() => expect(result.current.size).toBe(2));

    // One additional fetch for the new icon, not two for the whole set.
    expect(fetch).toBeCalledTimes(2);
  });

  // Issue #2108: a non-square custom icon (a wide logo, say) must keep its
  // aspect ratio on the canvas rather than being squashed into a square.
  // The uploaded SVG has width/height but no viewBox — exactly what a plain
  // `<svg width height>` export produces — and without a viewBox the wrapper's
  // `preserveAspectRatio` has no ratio to fit and the icon fills the padded box
  // square. So this covers viewBox synthesis end to end.
  it("carries a synthesized viewBox through to the canvas image for a wide custom icon", async () => {
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

    const canvas = renderHook(() =>
      useBackgroundImageMap([
        style({
          type: createVertexType("Wide"),
          iconUrl: "https://example.test/wide-logo.svg",
        }),
      ]),
    );
    await waitFor(() => expect(canvas.result.current.size).toBe(1));

    const url = canvas.result.current.get(createVertexType("Wide"))!;
    // The wrapper nests the icon as its own data uri, hence the double decode.
    expect(decodeURIComponent(decodeURIComponent(url))).toContain(
      'viewBox="0 0 400 100"',
    );
    expect(decodeURIComponent(url)).toContain(
      'preserveAspectRatio="xMidYMid meet"',
    );
  });
});
