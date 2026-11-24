// @vitest-environment happy-dom
import { expect, it } from "vite-plus/test";

import { createEdgeType, createVertexType } from "@/core";
import {
  createHeadlessGraph,
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
  resolvedStyle,
} from "@/utils/testing";

import { useSchemaGraphStyles } from "./useSchemaGraphStyles";

it("labels schema nodes and edges by display label over the per-type styles", () => {
  const person = createVertexType("Person");
  const knows = createEdgeType("KNOWS");
  const dbState = new DbState();
  const vertexConfig = {
    ...createRandomVertexTypeConfig(),
    type: person,
    color: "#ff0000",
  };
  const edgeConfig = {
    ...createRandomEdgeTypeConfig(),
    type: knows,
    lineColor: "#00ff00",
  };
  dbState.activeSchema.vertices = [vertexConfig];
  dbState.activeSchema.edges = [edgeConfig];
  dbState.addVertexStyle(person, vertexConfig);
  dbState.addEdgeStyle(knows, edgeConfig);

  const { result } = renderHookWithState(() => useSchemaGraphStyles(), dbState);
  const cy = createHeadlessGraph(result.current, [
    {
      group: "nodes",
      data: { id: person, type: person, displayLabel: "A Person" },
    },
    {
      group: "edges",
      data: {
        id: "person-knows-person",
        source: person,
        target: person,
        type: knows,
        displayLabel: "Knows",
      },
    },
  ]);

  expect(
    resolvedStyle(cy.getElementById(person), ["label", "background-color"]),
  ).toStrictEqual({ label: "A Person", "background-color": "rgb(255,0,0)" });
  expect(
    resolvedStyle(cy.getElementById("person-knows-person"), [
      "label",
      "line-color",
    ]),
  ).toStrictEqual({ label: "Knows", "line-color": "rgb(0,255,0)" });
});
