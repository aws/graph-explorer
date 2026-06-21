import type {
  Edge,
  EdgeId,
  EdgeType,
  Vertex,
  VertexId,
  VertexType,
} from "@/core";

/** Vertex type for a notion group, the only type allowed as a tree root. */
export const NOTION_GROUP_TYPE = "notionGroup" as VertexType;

/** Vertex type for a notion, allowed as a leaf or nested child in the tree. */
export const NOTION_TYPE = "notion" as VertexType;

/** Edge type that defines the parent → child hierarchy in the tree. */
export const CONTAINS_EDGE_TYPE = "contains" as EdgeType;

/** A single node in the notion hierarchy rendered by the Tree View. */
export type NotionTreeNode = {
  vertex: Vertex;
  children: NotionTreeNode[];
};

function hasType(vertex: Vertex, type: VertexType) {
  return vertex.types.includes(type) || vertex.type === type;
}

export function isNotionGroup(vertex: Vertex) {
  return hasType(vertex, NOTION_GROUP_TYPE);
}

export function isNotion(vertex: Vertex) {
  return hasType(vertex, NOTION_TYPE);
}

/** Vertices that are allowed to appear anywhere in the notion tree. */
function isNotionTreeVertex(vertex: Vertex) {
  return isNotionGroup(vertex) || isNotion(vertex);
}

/**
 * Builds the notion hierarchy from the vertices and edges currently on the
 * canvas.
 *
 * Only `notionGroup` and `notion` vertices are included, and the hierarchy is
 * defined solely by `contains` edges (source = parent, target = child). Roots
 * are every `notionGroup` that is not contained by another `notionGroup`.
 * Cyclic `contains` relationships are broken by not revisiting a vertex that is
 * already an ancestor in the current branch.
 */
export function buildNotionTree(
  nodes: ReadonlyMap<VertexId, Vertex>,
  edges: ReadonlyMap<EdgeId, Edge>,
): NotionTreeNode[] {
  const childIdsByParentId = new Map<VertexId, VertexId[]>();
  const seenChildrenByParentId = new Map<VertexId, Set<VertexId>>();
  const verticesWithNotionGroupParent = new Set<VertexId>();

  for (const edge of edges.values()) {
    if (edge.type !== CONTAINS_EDGE_TYPE) {
      continue;
    }

    const parent = nodes.get(edge.sourceId);
    const child = nodes.get(edge.targetId);
    if (!parent || !child) {
      continue;
    }
    // Only notion groups can contain other vertices.
    if (!isNotionGroup(parent) || !isNotionTreeVertex(child)) {
      continue;
    }

    const seenChildren =
      seenChildrenByParentId.get(parent.id) ?? new Set<VertexId>();
    if (!seenChildren.has(child.id)) {
      seenChildren.add(child.id);
      seenChildrenByParentId.set(parent.id, seenChildren);

      const childIds = childIdsByParentId.get(parent.id) ?? [];
      childIds.push(child.id);
      childIdsByParentId.set(parent.id, childIds);
    }

    verticesWithNotionGroupParent.add(child.id);
  }

  const buildNode = (
    vertex: Vertex,
    ancestorIds: Set<VertexId>,
  ): NotionTreeNode => {
    const childIds = childIdsByParentId.get(vertex.id) ?? [];
    const nextAncestorIds = new Set(ancestorIds).add(vertex.id);

    const children: NotionTreeNode[] = [];
    for (const childId of childIds) {
      if (nextAncestorIds.has(childId)) {
        continue;
      }
      const childVertex = nodes.get(childId);
      if (!childVertex) {
        continue;
      }
      children.push(buildNode(childVertex, nextAncestorIds));
    }

    return { vertex, children };
  };

  const roots: NotionTreeNode[] = [];
  for (const vertex of nodes.values()) {
    if (!isNotionGroup(vertex)) {
      continue;
    }
    if (verticesWithNotionGroupParent.has(vertex.id)) {
      continue;
    }
    roots.push(buildNode(vertex, new Set<VertexId>()));
  }

  return roots;
}
