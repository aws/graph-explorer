// @vitest-environment happy-dom
import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import type { Edge, Vertex } from "@/core/entities";

import { TooltipProvider } from "@/components/Tooltip";
import {
  activeConfigurationAtom,
  activeGraphSessionAtom,
  allGraphSessionsAtom,
  configurationAtom,
  createPendingGraphRestoration,
  getAppStore,
  graphViewLayoutAlgorithmAtom,
  pendingGraphRestorationAtom,
  schemaAtom,
  type GraphArrangement,
  type GraphSessionStorageModel,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { useRestoreGraphSession } from "@/core/StateProvider/graphSession/useRestoreGraphSession";
import { TestProvider } from "@/utils/testing";
import {
  createRandomEdge,
  createRandomRawConfiguration,
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import GraphViewer from "./GraphViewer";

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
let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

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

  const boundingBox = {
    width: 600,
    height: 400,
    top: 0,
    left: 0,
    right: 600,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => boundingBox,
  };
  originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = vi.fn(() => boundingBox) as any;
});

afterAll(() => {
  (globalThis as any).OffscreenCanvas = originalOffscreenCanvas;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  window.getComputedStyle = originalGetComputedStyle;
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

function renderGraphViewer(state: DbState) {
  const store = getAppStore();
  state.applyTo(store);
  return renderGraphViewerIntoStore(store);
}

function renderGraphViewerIntoStore(store: ReturnType<typeof getAppStore>) {
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

  const result = render(
    <TestProvider client={client} store={store}>
      <TooltipProvider>
        <GraphViewer />
      </TooltipProvider>
    </TestProvider>,
    { container },
  );

  return { store, ...result };
}

function createArrangement(
  vertices: Vertex[],
  overrides: Partial<GraphArrangement> = {},
): GraphArrangement {
  return {
    positions: vertices.map(v => ({ id: v.id, x: 123, y: 456 })),
    viewport: { pan: { x: 7, y: 8 }, zoom: 2 },
    ...overrides,
  };
}

function withLayoutAndSession(
  state: DbState,
  vertices: Vertex[],
  edges: Edge[],
  arrangement?: GraphArrangement,
) {
  state.vertices = vertices;
  state.edges = edges;
  state.withGraphSession({
    vertices: new Set(vertices.map(v => v.id)),
    edges: new Set(edges.map(e => e.id)),
    layout: "DAGRE_TB",
    arrangement,
  });
  return state;
}

describe("GraphViewer session integration", () => {
  test("updates an existing nonempty active session with the layout result", async () => {
    const vertex = createRandomVertex();
    const state = new DbState();
    withLayoutAndSession(state, [vertex], []);

    const { store } = renderGraphViewer(state);
    act(() => store.set(graphViewLayoutAlgorithmAtom, "DAGRE_TB"));

    await waitFor(
      () => {
        const session = store.get(activeGraphSessionAtom);
        expect(session?.arrangement).toBeDefined();
        expect(session?.arrangement?.positions).toHaveLength(1);
      },
      { timeout: 5000 },
    );
  });

  test("preserves a saved arrangement after the graph view remounts", async () => {
    const vertices = [createRandomVertex(), createRandomVertex()];
    const state = new DbState();
    withLayoutAndSession(state, vertices, []);

    const { store, unmount } = renderGraphViewer(state);
    await waitFor(
      () =>
        expect(store.get(activeGraphSessionAtom)?.arrangement).toBeDefined(),
      { timeout: 5000 },
    );

    const savedArrangement = createArrangement(vertices, {
      positions: [
        { id: vertices[0].id, x: 321, y: 654 },
        { id: vertices[1].id, x: 987, y: 123 },
      ],
    });
    act(() => {
      const session = store.get(activeGraphSessionAtom)!;
      store.set(activeGraphSessionAtom, {
        ...session,
        arrangement: savedArrangement,
      });
    });

    unmount();
    renderGraphViewerIntoStore(store);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    expect(store.get(activeGraphSessionAtom)?.arrangement).toStrictEqual(
      savedArrangement,
    );
  });

  test("does not create a session when none exists", async () => {
    const vertex = createRandomVertex();
    const state = new DbState();
    state.vertices = [vertex];
    state.edges = [];

    const { store } = renderGraphViewer(state);
    act(() => {
      store.set(allGraphSessionsAtom, new Map());
      store.set(graphViewLayoutAlgorithmAtom, "DAGRE_TB");
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    expect(store.get(allGraphSessionsAtom).size).toBe(0);
    expect(store.get(activeGraphSessionAtom)).toBeNull();
  });

  test("does not revive an empty active session", async () => {
    const vertex = createRandomVertex();
    const state = new DbState();
    state.vertices = [vertex];
    state.edges = [];
    state.withGraphSession({
      vertices: new Set(),
      edges: new Set(),
      layout: "DAGRE_TB",
    });

    const { store } = renderGraphViewer(state);
    act(() => store.set(graphViewLayoutAlgorithmAtom, "DAGRE_TB"));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    const session = store.get(activeGraphSessionAtom);
    expect(session).toBeDefined();
    expect(session?.arrangement).toBeUndefined();
  });

  test("consumes a matching pending restoration and preserves exact coordinates", async () => {
    const vertex = createRandomVertex();
    const state = new DbState();
    const arrangement = createArrangement([vertex]);
    withLayoutAndSession(state, [vertex], [], arrangement);
    const { store } = renderGraphViewer(state);
    act(() => {
      store.set(
        pendingGraphRestorationAtom,
        createPendingGraphRestoration(state.activeConfig.id, arrangement),
      );
      store.set(graphViewLayoutAlgorithmAtom, "DAGRE_TB");
    });

    await waitFor(
      () => expect(store.get(pendingGraphRestorationAtom)).toBeNull(),
      { timeout: 5000 },
    );

    const session = store.get(activeGraphSessionAtom);
    expect(session?.arrangement).toEqual(arrangement);
  });

  test("a stale ConfigurationId restoration cannot apply after connection switch", async () => {
    const vertex = createRandomVertex();
    const originalConfig = createRandomRawConfiguration();
    const activeConfig = createRandomRawConfiguration();

    const state = new DbState();
    state.vertices = [vertex];
    state.edges = [];
    state.activeConfig = activeConfig;
    state.withGraphSession({
      vertices: new Set([vertex.id]),
      edges: new Set(),
      layout: "DAGRE_TB",
    });

    const { store } = renderGraphViewer(state);
    act(() => {
      store.set(
        configurationAtom,
        new Map([
          [originalConfig.id, originalConfig],
          [activeConfig.id, activeConfig],
        ]),
      );
      store.set(
        schemaAtom,
        new Map([
          [originalConfig.id, state.activeSchema],
          [activeConfig.id, state.activeSchema],
        ]),
      );
      store.set(
        allGraphSessionsAtom,
        new Map([[activeConfig.id, store.get(activeGraphSessionAtom)!]]),
      );
      store.set(activeConfigurationAtom, activeConfig.id);
      store.set(
        pendingGraphRestorationAtom,
        createPendingGraphRestoration(
          originalConfig.id,
          createArrangement([vertex]),
        ),
      );
      store.set(graphViewLayoutAlgorithmAtom, "DAGRE_TB");
    });

    await waitFor(
      () => {
        const session = store.get(activeGraphSessionAtom);
        expect(session?.arrangement).toBeDefined();
      },
      { timeout: 5000 },
    );

    expect(store.get(pendingGraphRestorationAtom)).not.toBeNull();
  });
});

describe("GraphViewer refresh/session exact-coordinate regression", () => {
  test("restore from FakeExplorer preserves exact coordinates through GraphViewer", async () => {
    const explorer = new FakeExplorer();
    const vertex = createRandomVertex();
    const edge = createRandomEdge(vertex, vertex);
    explorer.addVertex(vertex);
    explorer.addEdge(edge);

    const state = new DbState(explorer);
    state.activeConfig = createRandomRawConfiguration();

    const arrangement = createArrangement([vertex]);
    const session: GraphSessionStorageModel = {
      vertices: new Set([vertex.id]),
      edges: new Set([edge.id]),
      layout: "DAGRE_TB",
      arrangement,
    };

    const { result } = renderHookWithState(
      () => useRestoreGraphSession(),
      state,
    );

    await act(async () => {
      await result.current.mutateAsync(session);
    });

    const store = getAppStore();
    renderGraphViewerIntoStore(store);

    await waitFor(
      () => expect(store.get(pendingGraphRestorationAtom)).toBeNull(),
      { timeout: 5000 },
    );

    expect(store.get(activeGraphSessionAtom)?.arrangement).toEqual(arrangement);
  });
});
