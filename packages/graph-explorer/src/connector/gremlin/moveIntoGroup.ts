import type { VertexId } from "@/core";

import { query } from "@/utils";

import { idParam } from "./idParam";

export type MoveIntoGroupRequest = {
  vertexId: VertexId;
  toGroupId: VertexId;
};

/**
 * Builds a Gremlin traversal that moves a vertex (a notion or a notion group)
 * into a notion group.
 *
 * Containment is a single bare `contains` edge, so every existing incoming
 * `contains` edge is dropped and one new `contains` edge is created from the
 * target group. Both steps run in one request, so they commit together (no
 * orphaned vertex if the add fails). The traversal returns the new edge element
 * so the caller can sync the graph without a re-query. We return the whole edge
 * (not just its id) because some engines, such as JanusGraph, use composite
 * relation identifiers that only map cleanly through the standard edge mapper.
 */
export function moveIntoGroupQuery({
  vertexId,
  toGroupId,
}: MoveIntoGroupRequest): string {
  return query`
    g.V(${idParam(vertexId)}).as("moved")
      .sideEffect(__.inE("contains").drop())
      .V(${idParam(toGroupId)})
      .addE("contains").to("moved")
  `;
}
