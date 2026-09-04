import { atom } from "jotai";

import type { ConfigurationId } from "../../ConfigurationProvider";
import type { VertexId } from "../../entities";

export type GraphNodePosition = {
  id: VertexId;
  x: number;
  y: number;
};

export type GraphViewport = {
  pan: { x: number; y: number };
  zoom: number;
};

export type GraphArrangement = {
  positions: GraphNodePosition[];
  viewport?: GraphViewport;
};

export type PendingGraphRestoration = GraphArrangement & {
  revision: number;
  target: ConfigurationId;
};

export const pendingGraphRestorationAtom = atom<PendingGraphRestoration | null>(
  null,
);

let nextRestorationRevision = 0;

export function createPendingGraphRestoration(
  target: ConfigurationId,
  arrangement: GraphArrangement,
): PendingGraphRestoration {
  nextRestorationRevision += 1;
  return { ...arrangement, revision: nextRestorationRevision, target };
}

export function getGraphRestorationForTarget(
  restoration: PendingGraphRestoration | null,
  target: ConfigurationId | undefined,
): PendingGraphRestoration | undefined {
  return restoration != null && restoration.target === target
    ? restoration
    : undefined;
}

export function arrangementsEqual(
  left: GraphArrangement | undefined,
  right: GraphArrangement,
): boolean {
  if (!left || left.positions.length !== right.positions.length) return false;
  if (
    left.viewport?.zoom !== right.viewport?.zoom ||
    left.viewport?.pan.x !== right.viewport?.pan.x ||
    left.viewport?.pan.y !== right.viewport?.pan.y
  ) {
    return false;
  }
  return left.positions.every((position, index) => {
    const other = right.positions[index];
    return (
      other != null &&
      position.id === other.id &&
      position.x === other.x &&
      position.y === other.y
    );
  });
}

export function retainGraphArrangementVertices(
  arrangement: GraphArrangement | undefined,
  vertexIds: Iterable<VertexId>,
): GraphArrangement | undefined {
  if (!arrangement) return undefined;

  const retainedIds = new Set(vertexIds);
  return {
    positions: arrangement.positions.filter(position =>
      retainedIds.has(position.id),
    ),
    viewport: arrangement.viewport,
  };
}

export function mergeGraphArrangements(
  existing: GraphArrangement | undefined,
  incoming: GraphArrangement,
  vertexIds: Iterable<VertexId>,
): GraphArrangement {
  const vertexIdSet = new Set(vertexIds);
  const byId = new Map<VertexId, GraphNodePosition>();

  for (const position of existing?.positions ?? []) {
    if (vertexIdSet.has(position.id)) {
      byId.set(position.id, position);
    }
  }

  for (const position of incoming.positions) {
    if (vertexIdSet.has(position.id)) {
      byId.set(position.id, position);
    }
  }

  const positions: GraphNodePosition[] = [];
  const seen = new Set<VertexId>();

  for (const position of existing?.positions ?? []) {
    if (!seen.has(position.id) && byId.has(position.id)) {
      positions.push(byId.get(position.id)!);
      seen.add(position.id);
    }
  }

  for (const position of incoming.positions) {
    if (!seen.has(position.id) && byId.has(position.id)) {
      positions.push(position);
      seen.add(position.id);
    }
  }

  return {
    positions,
    viewport: incoming.viewport ?? existing?.viewport,
  };
}
