import { useAtomValue } from "jotai";
import { ChevronDownIcon, ChevronRightIcon, ListTreeIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  VertexIconByType,
} from "@/components";
import {
  activeConnectionAtom,
  type DisplayVertex,
  edgesAtom,
  type NeighborCounts,
  nodesAtom,
  useAllNeighbors,
  useDisplayVerticesInCanvas,
  type VertexId,
} from "@/core";
import { useExpandNode, useMoveIntoGroup } from "@/hooks";
import { useDefaultNeighborExpansionLimit } from "@/hooks/useExpandNode";
import { useGraphSelection } from "@/modules/GraphViewer/useGraphSelection";
import { cn, LABELS } from "@/utils";

import {
  buildNotionTree,
  CONTAINS_EDGE_TYPE,
  isNotionGroup,
  type NotionTreeNode,
} from "./buildNotionTree";

/** Drag-and-drop callbacks and state shared by every tree row. */
type TreeDragAndDrop = {
  /** Only enabled on Gremlin connections, where the move can be persisted. */
  enabled: boolean;
  /** The group row currently hovered as a valid drop target, for highlighting. */
  dropTargetGroupId: VertexId | null;
  setDropTargetGroupId: (id: VertexId | null) => void;
  /** Whether dropping the dragged vertex onto the given group is allowed. */
  canDropOnGroup: (toGroupId: VertexId) => boolean;
  onVertexDragStart: (vertexId: VertexId) => void;
  onVertexDragEnd: () => void;
  /** Persists the dragged vertex's move into the given group. */
  onVertexDropOnGroup: (toGroupId: VertexId) => void;
};

export default function TreeView() {
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);
  const displayVertices = useDisplayVerticesInCanvas();
  const neighborCounts = useAllNeighbors();

  const { expandNode } = useExpandNode();
  const expansionLimit = useDefaultNeighborExpansionLimit();
  const expandNeighbors = (vertexId: VertexId) =>
    expandNode({ vertexId, limit: expansionLimit ?? undefined });

  const tree = useMemo(() => buildNotionTree(nodes, edges), [nodes, edges]);

  const [expandedIds, setExpandedIds] = useState<Set<VertexId>>(new Set());

  const toggleExpanded = (id: VertexId) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // Dragging a notion or group onto another group persists the move via Gremlin.
  const activeConnection = useAtomValue(activeConnectionAtom);
  const { moveIntoGroup } = useMoveIntoGroup();
  const draggedVertexIdRef = useRef<VertexId | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<VertexId | null>(
    null,
  );

  // The group each vertex currently belongs to, via its incoming `contains`
  // edge. Used to ignore no-op drops and to detect cycles.
  const parentGroupByVertexId = useMemo(() => {
    const map = new Map<VertexId, VertexId>();
    for (const edge of edges.values()) {
      if (edge.type === CONTAINS_EDGE_TYPE) {
        map.set(edge.targetId, edge.sourceId);
      }
    }
    return map;
  }, [edges]);

  // A drop would create a cycle when the target group is the dragged vertex
  // itself or sits within the dragged vertex's own subtree.
  const wouldCreateCycle = (draggedId: VertexId, toGroupId: VertexId) => {
    let current: VertexId | undefined = toGroupId;
    while (current != null) {
      if (current === draggedId) {
        return true;
      }
      current = parentGroupByVertexId.get(current);
    }
    return false;
  };

  const canDropOnGroup = (draggedId: VertexId | null, toGroupId: VertexId) => {
    if (draggedId == null) {
      return false;
    }
    // Already in this group, or the move would create a containment cycle.
    if (parentGroupByVertexId.get(draggedId) === toGroupId) {
      return false;
    }
    return !wouldCreateCycle(draggedId, toGroupId);
  };

  const dnd: TreeDragAndDrop = {
    enabled: activeConnection?.queryEngine === "gremlin",
    dropTargetGroupId,
    setDropTargetGroupId,
    canDropOnGroup: toGroupId =>
      canDropOnGroup(draggedVertexIdRef.current, toGroupId),
    onVertexDragStart: vertexId => {
      draggedVertexIdRef.current = vertexId;
    },
    onVertexDragEnd: () => {
      draggedVertexIdRef.current = null;
    },
    onVertexDropOnGroup: toGroupId => {
      const draggedId = draggedVertexIdRef.current;
      draggedVertexIdRef.current = null;
      setDropTargetGroupId(null);
      if (
        draggedId == null ||
        parentGroupByVertexId.get(draggedId) === toGroupId
      ) {
        return;
      }
      if (wouldCreateCycle(draggedId, toGroupId)) {
        toast.error("Cannot move a group into itself or one of its subgroups");
        return;
      }
      moveIntoGroup({ vertexId: draggedId, toGroupId });
    },
  };

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>
          <ListTreeIcon className="size-5" />
          Tree View
        </PanelTitle>
      </PanelHeader>
      <PanelContent className="p-1">
        {tree.length === 0 ? (
          <p className="text-text-secondary px-3 py-4 text-sm">
            No notion groups are on the graph yet. Add a notion group to see its
            hierarchy here.
          </p>
        ) : (
          <ul role="tree" className="flex flex-col">
            {tree.map(node => (
              <TreeRow
                key={String(node.vertex.id)}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggleExpanded={toggleExpanded}
                displayVertices={displayVertices}
                neighborCounts={neighborCounts}
                onExpandNeighbors={expandNeighbors}
                dnd={dnd}
              />
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}

type TreeRowProps = {
  node: NotionTreeNode;
  depth: number;
  expandedIds: Set<VertexId>;
  onToggleExpanded: (id: VertexId) => void;
  displayVertices: Map<VertexId, DisplayVertex>;
  neighborCounts: Map<VertexId, NeighborCounts>;
  onExpandNeighbors: (id: VertexId) => void;
  dnd: TreeDragAndDrop;
};

function TreeRow({
  node,
  depth,
  expandedIds,
  onToggleExpanded,
  displayVertices,
  neighborCounts,
  onExpandNeighbors,
  dnd,
}: TreeRowProps) {
  const { graphSelection, replaceGraphSelection } = useGraphSelection();

  const vertexId = node.vertex.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(vertexId);
  const isSelected = graphSelection.isVertexSelected(vertexId);

  // Every tree vertex (notion or group) can be dragged; only groups accept
  // drops.
  const isDraggable = dnd.enabled;
  const isDropTarget = dnd.enabled && isNotionGroup(node.vertex);
  const isActiveDropTarget = isDropTarget && dnd.dropTargetGroupId === vertexId;

  // For notion groups, the number of `contains` neighbors not yet loaded into
  // the graph. Double clicking the row runs the graph Expand action to load
  // them, just like the Graph View.
  const unexpandedCount = isNotionGroup(node.vertex)
    ? (neighborCounts.get(vertexId)?.unfetched ?? 0)
    : 0;

  const display = displayVertices.get(vertexId);
  const label =
    display && display.displayName !== LABELS.MISSING_VALUE
      ? display.displayName
      : (display?.displayId ?? String(vertexId));

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={cn(
          "hover:bg-primary-subtle-hover flex items-start gap-1 rounded text-sm",
          isSelected && "bg-brand-100 dark:bg-brand-900",
          isDraggable && "cursor-grab",
          isActiveDropTarget && "ring-brand-500 ring-2 ring-inset",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        draggable={isDraggable}
        onDragStart={
          isDraggable
            ? event => {
                dnd.onVertexDragStart(vertexId);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", label);
              }
            : undefined
        }
        onDragEnd={isDraggable ? () => dnd.onVertexDragEnd() : undefined}
        onDragOver={
          isDropTarget
            ? event => {
                if (!dnd.canDropOnGroup(vertexId)) {
                  return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dnd.dropTargetGroupId !== vertexId) {
                  dnd.setDropTargetGroupId(vertexId);
                }
              }
            : undefined
        }
        onDragLeave={
          isDropTarget
            ? () => {
                if (dnd.dropTargetGroupId === vertexId) {
                  dnd.setDropTargetGroupId(null);
                }
              }
            : undefined
        }
        onDrop={
          isDropTarget
            ? event => {
                event.preventDefault();
                dnd.onVertexDropOnGroup(vertexId);
              }
            : undefined
        }
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => onToggleExpanded(vertexId)}
            className="text-text-secondary hover:text-text-primary mt-1 flex size-5 shrink-0 items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <VertexIconByType
          vertexType={node.vertex.type}
          className="mt-1.5 size-4 shrink-0"
        />
        <button
          type="button"
          onClick={() => replaceGraphSelection({ vertices: [vertexId] })}
          onDoubleClick={() => onExpandNeighbors(vertexId)}
          className="min-w-0 grow py-1 text-left break-words"
        >
          {label}
        </button>
        {unexpandedCount > 0 && (
          <span
            title={`${unexpandedCount} relationships not yet expanded — double click to expand`}
            aria-label={`${unexpandedCount} relationships not yet expanded`}
            className="bg-primary-subtle text-text-secondary mt-1 mr-1 shrink-0 rounded-full px-1.5 text-xs leading-5 tabular-nums"
          >
            {unexpandedCount}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <ul role="group" className="flex flex-col">
          {node.children.map(child => (
            <TreeRow
              key={String(child.vertex.id)}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
              displayVertices={displayVertices}
              neighborCounts={neighborCounts}
              onExpandNeighbors={onExpandNeighbors}
              dnd={dnd}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
