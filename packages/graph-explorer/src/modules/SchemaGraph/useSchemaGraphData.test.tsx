// @vitest-environment happy-dom
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import type { AppStore } from "@/core";

import { createEdgeType, createVertexType, schemaAtom } from "@/core";
import { useBackgroundImageMap } from "@/core/icons";
import {
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
  renderHookWithJotai,
} from "@/utils/testing";

import { useSchemaGraphData } from "./useSchemaGraphData";

vi.mock(import("@/core/icons"), async importOriginal => ({
  ...(await importOriginal()),
  useBackgroundImageMap: vi.fn(),
}));
const mockMap = useBackgroundImageMap as Mock;

describe("useSchemaGraphData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMap.mockImplementation(
      (cfgs: { type: string }[]) =>
        new Map(cfgs.map(c => [c.type, "img:" + c.type])),
    );
  });

  it("enriches nodes with per-type ge_* style data", async () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
      color: "#128EE5",
      shape: "hexagon" as const,
      borderWidth: 2,
    };
    const dbState = new DbState();
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);

    const { result } = renderHookWithState(() => useSchemaGraphData(), dbState);
    await waitFor(() => expect(result.current.nodes.length).toBe(1));

    const node = result.current.nodes[0];
    expect(node.data.ge_color).toBe("#128EE5");
    expect(node.data.ge_shape).toBe("hexagon");
    expect(node.data.ge_borderWidth).toBe(2);
    expect(node.data.ge_borderOpacity).toBe(1);
    expect(node.data.ge_iconUrl).toBe("img:Person");
  });

  it("enriches edges with per-type ge_* style data (solid: no dash pattern)", async () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
    };
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      lineColor: "#ff0000",
      lineStyle: "solid" as const,
      sourceArrowStyle: "none" as const,
      targetArrowStyle: "triangle" as const,
    };
    const dbState = new DbState();
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);
    dbState.activeSchema.edgeConnections = [
      {
        edgeType: edgeConfig.type,
        sourceVertexType: vertexConfig.type,
        targetVertexType: vertexConfig.type,
      },
    ];

    const { result } = renderHookWithState(() => useSchemaGraphData(), dbState);
    await waitFor(() => expect(result.current.edges.length).toBe(1));

    const edge = result.current.edges[0];
    expect(edge.data.ge_lineColor).toBe("#ff0000");
    expect(edge.data.ge_lineStyle).toBe("solid");
    expect(edge.data.ge_targetArrowShape).toBe("triangle");
    expect(edge.data.ge_lineDashPattern).toEqual([6, 3]);
  });

  it("emits the dashed ge_lineDashPattern for dashed edges", async () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
    };
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      lineStyle: "dashed" as const,
    };
    const dbState = new DbState();
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);
    dbState.activeSchema.edgeConnections = [
      {
        edgeType: edgeConfig.type,
        sourceVertexType: vertexConfig.type,
        targetVertexType: vertexConfig.type,
      },
    ];

    const { result } = renderHookWithState(() => useSchemaGraphData(), dbState);
    await waitFor(() => expect(result.current.edges.length).toBe(1));

    expect(result.current.edges[0].data.ge_lineDashPattern).toEqual([5, 6]);
  });

  // Regression: the style scope used to be read from `useActiveSchema`, which is
  // deferred, while the type configs read the schema atom directly. A schema sync
  // that added a label could therefore produce a render with a config whose style
  // had not arrived, which threw and took down the whole view. Scope and loop now
  // come from the same source, so a newly synced type is always styled.
  it("styles a vertex type added by a later schema sync", async () => {
    const person = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
    };
    const city = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("City"),
      color: "#abcdef",
    };
    const dbState = new DbState();
    dbState.activeSchema.vertices = [person];
    // Registered up front; the type only enters the schema later.
    dbState.addVertexStyle(city.type, { color: "#abcdef" });

    let store!: AppStore;
    const { result } = renderHookWithJotai(
      () => useSchemaGraphData(),
      s => {
        store = s;
        dbState.applyTo(s);
      },
    );
    await waitFor(() => expect(result.current.nodes.length).toBe(1));

    act(() =>
      store.set(
        schemaAtom,
        new Map([
          [
            dbState.activeConfig.id,
            { ...dbState.activeSchema, vertices: [person, city] },
          ],
        ]),
      ),
    );

    await waitFor(() => expect(result.current.nodes.length).toBe(2));
    const cityNode = result.current.nodes.find(n => n.data.type === city.type);
    expect(cityNode?.data.ge_color).toBe("#abcdef");
  });
});
