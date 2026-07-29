import { describe, expect, it } from "vitest";

import type { DisplayVertex, DisplayVertexTypeConfig } from "@/core";

import { createVertexType } from "@/core/entities";

import { filterVertexTypeConfigsForCanvasVertices } from "./filterLegendVertexTypeConfigs";

function configForType(type: string): DisplayVertexTypeConfig {
  const vt = createVertexType(type);
  return {
    type: vt,
    displayLabel: type,
    attributes: [],
  };
}

describe("filterVertexTypeConfigsForCanvasVertices", () => {
  it("keeps only configs whose type appears on a canvas vertex", () => {
    const allConfigs: DisplayVertexTypeConfig[] = [
      configForType("airport"),
      configForType("country"),
    ];
    const canvasVertices = [
      { types: [createVertexType("airport")] },
    ] as DisplayVertex[];

    const result = filterVertexTypeConfigsForCanvasVertices(
      allConfigs,
      canvasVertices,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe(allConfigs[0]?.type);
  });

  it("includes types from every label on a multi-label vertex", () => {
    const allConfigs: DisplayVertexTypeConfig[] = [
      configForType("person"),
      configForType("worker"),
      configForType("company"),
    ];
    const canvasVertices = [
      {
        types: [createVertexType("person"), createVertexType("worker")],
      },
    ] as DisplayVertex[];

    const result = filterVertexTypeConfigsForCanvasVertices(
      allConfigs,
      canvasVertices,
    );

    expect(result.map(c => c.type)).toEqual([
      allConfigs[0]?.type,
      allConfigs[1]?.type,
    ]);
  });

  it("returns an empty list when the canvas has no vertices", () => {
    const allConfigs: DisplayVertexTypeConfig[] = [configForType("airport")];

    const result = filterVertexTypeConfigsForCanvasVertices(allConfigs, []);

    expect(result).toEqual([]);
  });
});
