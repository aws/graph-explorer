import type { Core } from "cytoscape";

import { createRenderedVertexId, type VertexId } from "@/core";
import {
  mergeGraphArrangements,
  type GraphArrangement,
} from "@/core/StateProvider/graphSession";

export function captureGraphArrangement(
  cy: Core,
  vertexIds: Iterable<VertexId>,
  existingArrangement?: GraphArrangement,
): GraphArrangement {
  const positions = [];
  for (const id of vertexIds) {
    const node = cy.getElementById(createRenderedVertexId(id));
    if (node.empty()) continue;
    const position = node.position();
    positions.push({ id, x: position.x, y: position.y });
  }

  const captured: GraphArrangement = {
    positions,
    viewport: { pan: cy.pan(), zoom: cy.zoom() },
  };

  return existingArrangement
    ? mergeGraphArrangements(existingArrangement, captured, vertexIds)
    : captured;
}
