import cytoscape from "cytoscape";

import { createRenderedVertexId, createVertexId } from "@/core";

import { captureGraphArrangement } from "./graphArrangement";

test("captures requested existing positions and the viewport", () => {
  const present = createVertexId(1);
  const absent = createVertexId("absent");
  const cy = cytoscape({
    headless: true,
    elements: [{ data: { id: createRenderedVertexId(present) } }],
  });
  cy.getElementById(createRenderedVertexId(present)).position({ x: 12, y: 34 });
  cy.viewport({ pan: { x: 56, y: 78 }, zoom: 2 });

  expect(captureGraphArrangement(cy, [present, absent])).toStrictEqual({
    positions: [{ id: present, x: 12, y: 34 }],
    viewport: { pan: { x: 56, y: 78 }, zoom: 2 },
  });
});

test("merges captured positions with existing positions for vertices not currently rendered", () => {
  const present = createVertexId("present");
  const missing = createVertexId("missing");
  const obsolete = createVertexId("obsolete");
  const cy = cytoscape({
    headless: true,
    elements: [{ data: { id: createRenderedVertexId(present) } }],
  });
  cy.getElementById(createRenderedVertexId(present)).position({
    x: 100,
    y: 200,
  });
  cy.viewport({ pan: { x: 1, y: 2 }, zoom: 3 });

  const existing = {
    positions: [
      { id: present, x: 12, y: 34 },
      { id: missing, x: 56, y: 78 },
      { id: obsolete, x: 90, y: 10 },
    ],
    viewport: { pan: { x: 4, y: 5 }, zoom: 6 },
  };

  const result = captureGraphArrangement(cy, [present, missing], existing);

  expect(result).toStrictEqual({
    positions: [
      { id: present, x: 100, y: 200 },
      { id: missing, x: 56, y: 78 },
    ],
    viewport: { pan: { x: 1, y: 2 }, zoom: 3 },
  });
});
