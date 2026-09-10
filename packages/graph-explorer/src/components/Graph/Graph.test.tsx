// @vitest-environment happy-dom
import { render, waitFor } from "@testing-library/react";
import { act, useEffect, useRef } from "react";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { createRandomRawConfiguration, TestProvider } from "@/utils/testing";

import { Graph, type GraphProps, type GraphRef } from "./Graph";
import { GraphProvider, useGraphRef } from "./GraphContext";

function createMockContext() {
  return new Proxy({} as Record<string, unknown>, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as string];
      }
      if (prop === "measureText") {
        return () => ({
          width: 0,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: 0,
        });
      }
      if (prop === "getImageData") {
        return () => ({ data: new Uint8ClampedArray(4) });
      }
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return () => ({ addColorStop: () => {} });
      }
      if (prop === "createPattern") {
        return () => null;
      }
      return () => {};
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  });
}

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
let originalOffscreenCanvas: unknown;
let originalGetComputedStyle: typeof window.getComputedStyle;

beforeAll(() => {
  originalOffscreenCanvas = (globalThis as any).OffscreenCanvas;
  (globalThis as any).OffscreenCanvas = undefined;

  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    type: string,
    ...args: any[]
  ) {
    if (type === "2d") {
      return createMockContext() as any;
    }
    return originalGetContext.call(this, type, ...args);
  };

  originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = vi.fn((_el: Element) => {
    const prop = (name: string) => {
      if (name === "width") return "600px";
      if (name === "height") return "400px";
      if (name.includes("padding")) return "0px";
      return "";
    };
    return {
      getPropertyValue: prop,
      width: "600px",
      height: "400px",
    } as any;
  });
});

afterAll(() => {
  (globalThis as any).OffscreenCanvas = originalOffscreenCanvas;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  window.getComputedStyle = originalGetComputedStyle;
});

type GraphHarnessProps = {
  onReady?: (graphRef: GraphRef) => void;
} & GraphProps;

function GraphHarness({ onReady, ...props }: GraphHarnessProps) {
  const graphRef = useGraphRef();
  const readyRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!readyRef.current && graphRef.current?.cytoscape) {
        readyRef.current = true;
        onReady?.(graphRef.current);
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
  }, [graphRef, onReady]);

  return <Graph {...props} />;
}

function renderGraph(props: GraphHarnessProps) {
  const store = getAppStore();
  const client = createQueryClient();

  const container = document.createElement("div");
  container.style.width = "600px";
  container.style.height = "400px";
  Object.defineProperty(container, "clientWidth", {
    value: 600,
    configurable: true,
  });
  Object.defineProperty(container, "clientHeight", {
    value: 400,
    configurable: true,
  });
  document.body.appendChild(container);

  return render(
    <TestProvider client={client} store={store}>
      <GraphProvider>
        <GraphHarness {...props} />
      </GraphProvider>
    </TestProvider>,
    { container },
  );
}

function waitForGraphReady(onReady: ReturnType<typeof vi.fn>) {
  return waitFor(() => expect(onReady).toHaveBeenCalled(), { timeout: 5000 });
}

describe("Graph lifecycle", () => {
  test("applies a pending restoration once and skips the automatic layout", async () => {
    const onReady = vi.fn();
    const onRestorationConsumed = vi.fn();
    const onLayoutUpdated = vi.fn();
    const onArrangementChanged = vi.fn();

    const positions = [
      { id: "a", x: 12, y: 34 },
      { id: "b", x: 56, y: 78 },
    ];
    const viewport = { pan: { x: 9, y: 10 }, zoom: 2 };

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 1,
        positions,
        viewport,
      },
      onRestorationConsumed,
      onLayoutUpdated,
      onArrangementChanged,
    });

    await waitForGraphReady(onReady);

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    const cy = graphRef.cytoscape!;

    expect(cy.getElementById("a").position()).toMatchObject({ x: 12, y: 34 });
    expect(cy.getElementById("b").position()).toMatchObject({ x: 56, y: 78 });
    expect(cy.pan()).toEqual(viewport.pan);
    expect(cy.zoom()).toBe(viewport.zoom);

    expect(onRestorationConsumed).toHaveBeenCalledTimes(1);
    expect(onRestorationConsumed).toHaveBeenCalledWith(1);

    expect(onLayoutUpdated).not.toHaveBeenCalled();
    expect(onArrangementChanged).not.toHaveBeenCalled();
  });

  test("restores the same revision only once", async () => {
    const onReady = vi.fn();
    const onRestorationConsumed = vi.fn();
    const onLayoutUpdated = vi.fn();

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 2,
        positions: [
          { id: "a", x: 1, y: 2 },
          { id: "b", x: 3, y: 4 },
        ],
      },
      onRestorationConsumed,
      onLayoutUpdated,
    });

    await waitForGraphReady(onReady);
    expect(onRestorationConsumed).toHaveBeenCalledTimes(1);

    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            onReady={onReady}
            nodes={[{ data: { id: "a" } }, { data: { id: "b" } }]}
            edges={[]}
            layout="F_COSE"
            useAnimation={false}
            restoration={{
              revision: 2,
              positions: [
                { id: "a", x: 1, y: 2 },
                { id: "b", x: 3, y: 4 },
              ],
            }}
            onRestorationConsumed={onRestorationConsumed}
            onLayoutUpdated={onLayoutUpdated}
          />
        </GraphProvider>
      </TestProvider>,
    );

    // Give React time to reconcile the identical restoration
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(onRestorationConsumed).toHaveBeenCalledTimes(1);
    expect(onLayoutUpdated).not.toHaveBeenCalled();
  });

  test("does not replace a newer restoration with an older revision", async () => {
    const onReady = vi.fn();
    const onRestorationConsumed = vi.fn();
    const newerPositions = [
      { id: "a", x: 12, y: 34 },
      { id: "b", x: 56, y: 78 },
    ];

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: { revision: 2, positions: newerPositions },
      onRestorationConsumed,
    });

    await waitForGraphReady(onReady);
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;

    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            onReady={onReady}
            nodes={[{ data: { id: "a" } }, { data: { id: "b" } }]}
            edges={[]}
            layout="F_COSE"
            useAnimation={false}
            restoration={{
              revision: 1,
              positions: [
                { id: "a", x: 100, y: 200 },
                { id: "b", x: 300, y: 400 },
              ],
            }}
            onRestorationConsumed={onRestorationConsumed}
          />
        </GraphProvider>
      </TestProvider>,
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(cy.getElementById("a").position()).toMatchObject(newerPositions[0]);
    expect(cy.getElementById("b").position()).toMatchObject(newerPositions[1]);
    expect(onRestorationConsumed).toHaveBeenCalledTimes(1);
  });

  test("a later explicit rerun still runs the layout", async () => {
    const onReady = vi.fn();
    const onLayoutRunningChanged = vi.fn();

    const positions = [{ id: "a", x: 1, y: 2 }];
    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 3,
        positions,
      },
      onLayoutRunningChanged,
    });

    await waitForGraphReady(onReady);
    expect(onLayoutRunningChanged).not.toHaveBeenCalled();

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    graphRef.runLayout();

    await waitFor(
      () => expect(onLayoutRunningChanged).toHaveBeenCalledWith(true),
      { timeout: 3000 },
    );
    await waitFor(
      () => expect(onLayoutRunningChanged).toHaveBeenCalledWith(false),
      { timeout: 3000 },
    );
  });

  test("a subsequent structural change still triggers the layout", async () => {
    const onReady = vi.fn();
    const onLayoutUpdated = vi.fn();

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 4,
        positions: [{ id: "a", x: 1, y: 2 }],
      },
      onLayoutUpdated,
    });

    await waitForGraphReady(onReady);
    expect(onLayoutUpdated).not.toHaveBeenCalled();

    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            onReady={onReady}
            nodes={[{ data: { id: "a" } }, { data: { id: "b" } }]}
            edges={[{ data: { id: "ab", source: "a", target: "b" } }]}
            layout="F_COSE"
            useAnimation={false}
            onLayoutUpdated={onLayoutUpdated}
          />
        </GraphProvider>
      </TestProvider>,
    );

    await waitFor(() => expect(onLayoutUpdated).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
  });

  test("partially restores matching nodes and lays out unmatched nodes", async () => {
    const onReady = vi.fn();
    const onLayoutUpdated = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [{ data: { id: "ab", source: "a", target: "b" } }],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 11,
        positions: [{ id: "a", x: 12, y: 34 }],
      },
      onLayoutUpdated,
    });

    await waitForGraphReady(onReady);
    await waitFor(() => expect(onLayoutUpdated).toHaveBeenCalledTimes(1));
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;

    expect(cy.getElementById("a").position()).toMatchObject({ x: 12, y: 34 });
    expect(cy.getElementById("b").position()).not.toMatchObject({ x: 0, y: 0 });
    expect(cy.getElementById("a").locked()).toBe(false);
  });

  test("a restoration with zero matching nodes runs the normal layout", async () => {
    const onReady = vi.fn();
    const onLayoutUpdated = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [{ data: { id: "ab", source: "a", target: "b" } }],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 12,
        positions: [{ id: "missing", x: 12, y: 34 }],
      },
      onLayoutUpdated,
    });

    await waitForGraphReady(onReady);
    await waitFor(() => expect(onLayoutUpdated).toHaveBeenCalledTimes(1));
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;
    expect(cy.getElementById("a").position()).not.toMatchObject({ x: 0, y: 0 });
  });

  test("mounting with no restoration runs the layout", async () => {
    const onReady = vi.fn();
    const onLayoutUpdated = vi.fn();
    const onRestorationConsumed = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [{ data: { id: "ab", source: "a", target: "b" } }],
      layout: "F_COSE",
      useAnimation: false,
      onLayoutUpdated,
      onRestorationConsumed,
    });

    await waitForGraphReady(onReady);

    expect(onLayoutUpdated).toHaveBeenCalled();
    expect(onRestorationConsumed).not.toHaveBeenCalled();
  });
});

describe("Graph arrangement capture", () => {
  test("layoutstop captures final coordinates", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }, { data: { id: "b" } }],
      edges: [{ data: { id: "ab", source: "a", target: "b" } }],
      layout: "DAGRE_TB",
      useAnimation: false,
      onArrangementChanged,
    });

    await waitForGraphReady(onReady);
    await waitFor(() => expect(onArrangementChanged).toHaveBeenCalled(), {
      timeout: 3000,
    });

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    const cy = graphRef.cytoscape!;
    const capturedCy = onArrangementChanged.mock.calls[0][0];

    expect(capturedCy).toBe(cy);
    const pos = cy.getElementById("a").position();
    expect(pos).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
    expect(pos.x).not.toBe(0);
    expect(pos.y).not.toBe(0);
  });

  test("dragfree captures user-adjusted coordinates once", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 5,
        positions: [{ id: "a", x: 0, y: 0 }],
      },
      onArrangementChanged,
    });

    await waitForGraphReady(onReady);
    expect(onArrangementChanged).not.toHaveBeenCalled();

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    const cy = graphRef.cytoscape!;

    const node = cy.getElementById("a");
    node.position({ x: 111, y: 222 });
    node.emit("dragfree");

    await waitFor(() => expect(onArrangementChanged).toHaveBeenCalledTimes(1), {
      timeout: 1000,
    });

    expect(cy.getElementById("a").position()).toMatchObject({
      x: 111,
      y: 222,
    });
  });

  test("pan and zoom callbacks are debounced", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();
    const onPanChanged = vi.fn();
    const onZoomChanged = vi.fn();

    renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 6,
        positions: [{ id: "a", x: 0, y: 0 }],
      },
      onArrangementChanged,
      onPanChanged,
      onZoomChanged,
    });

    await waitForGraphReady(onReady);

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    const cy = graphRef.cytoscape!;

    cy.pan({ x: 50, y: 60 });
    cy.zoom(3);

    expect(onPanChanged).not.toHaveBeenCalled();
    expect(onZoomChanged).not.toHaveBeenCalled();
    expect(onArrangementChanged).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(onPanChanged).not.toHaveBeenCalled();
    expect(onZoomChanged).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(onPanChanged).toHaveBeenCalledWith({ x: 50, y: 60 });
    expect(onZoomChanged).toHaveBeenCalledWith(3);
    expect(onArrangementChanged).toHaveBeenCalled();
  });

  test("captures the connection where layout and drag events started", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();
    const firstConnection = createRandomRawConfiguration().id;
    const secondConnection = createRandomRawConfiguration().id;

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 8,
        positions: [{ id: "a", x: 0, y: 0 }],
      },
      connectionId: firstConnection,
      onArrangementChanged,
    });
    await waitForGraphReady(onReady);
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;

    cy.emit("layoutstart");
    cy.getElementById("a").emit("grab");
    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            nodes={[{ data: { id: "a" } }]}
            edges={[]}
            layout="F_COSE"
            useAnimation={false}
            connectionId={secondConnection}
            onArrangementChanged={onArrangementChanged}
          />
        </GraphProvider>
      </TestProvider>,
    );
    cy.emit("layoutstop");
    cy.getElementById("a").emit("dragfree");

    expect(onArrangementChanged.mock.calls.map(call => call[1])).toEqual([
      firstConnection,
      firstConnection,
    ]);
  });

  test("drops a queued viewport capture after its connection changes", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();
    const firstConnection = createRandomRawConfiguration().id;
    const secondConnection = createRandomRawConfiguration().id;

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 9,
        positions: [{ id: "a", x: 0, y: 0 }],
      },
      connectionId: firstConnection,
      onArrangementChanged,
    });
    await waitForGraphReady(onReady);
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;

    cy.pan({ x: 10, y: 20 });
    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            nodes={[{ data: { id: "a" } }]}
            edges={[]}
            layout="F_COSE"
            useAnimation={false}
            connectionId={secondConnection}
            onArrangementChanged={onArrangementChanged}
          />
        </GraphProvider>
      </TestProvider>,
    );

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(onArrangementChanged).not.toHaveBeenCalled();
  });

  test("cancels a queued viewport capture when restoration starts", async () => {
    const onReady = vi.fn();
    const onArrangementChanged = vi.fn();
    const onPanChanged = vi.fn();

    const { rerender } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      onArrangementChanged,
      onPanChanged,
    });
    await waitForGraphReady(onReady);
    const cy = (onReady.mock.calls[0][0] as GraphRef).cytoscape!;
    await waitFor(() => expect(onArrangementChanged).toHaveBeenCalled());
    onArrangementChanged.mockClear();
    onPanChanged.mockClear();

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    cy.pan({ x: 10, y: 20 });
    rerender(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <GraphProvider>
          <GraphHarness
            nodes={[{ data: { id: "a" } }]}
            edges={[]}
            layout="F_COSE"
            useAnimation={false}
            restoration={{
              revision: 10,
              positions: [{ id: "a", x: 30, y: 40 }],
              viewport: { pan: { x: 50, y: 60 }, zoom: 2 },
            }}
            onArrangementChanged={onArrangementChanged}
            onPanChanged={onPanChanged}
          />
        </GraphProvider>
      </TestProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(200);
    });
    vi.useRealTimers();

    expect(onPanChanged).not.toHaveBeenCalled();
    expect(onArrangementChanged).not.toHaveBeenCalled();
  });

  test("cleanup cancels pending debounced callbacks", async () => {
    const onReady = vi.fn();
    const onZoomChanged = vi.fn();

    const { unmount } = renderGraph({
      onReady,
      nodes: [{ data: { id: "a" } }],
      edges: [],
      layout: "F_COSE",
      useAnimation: false,
      restoration: {
        revision: 7,
        positions: [{ id: "a", x: 0, y: 0 }],
      },
      onZoomChanged,
    });

    await waitForGraphReady(onReady);

    const graphRef = onReady.mock.calls[0][0] as GraphRef;
    const cy = graphRef.cytoscape!;

    cy.zoom(5);
    unmount();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(onZoomChanged).not.toHaveBeenCalled();
  });
});
