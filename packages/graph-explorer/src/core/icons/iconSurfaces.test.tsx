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
});
