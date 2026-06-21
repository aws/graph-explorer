import { useAtomValue } from "jotai";
import { ChevronDownIcon, ChevronRightIcon, ListTreeIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components";
import {
  type DisplayVertex,
  edgesAtom,
  type NeighborCounts,
  nodesAtom,
  useAllNeighbors,
  useDisplayVerticesInCanvas,
  type VertexId,
} from "@/core";
import { useExpandNode } from "@/hooks";
import { useDefaultNeighborExpansionLimit } from "@/hooks/useExpandNode";
import { useGraphSelection } from "@/modules/GraphViewer/useGraphSelection";
import { cn, LABELS } from "@/utils";

import {
  buildNotionTree,
  isNotionGroup,
  type NotionTreeNode,
} from "./buildNotionTree";

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
};

function TreeRow({
  node,
  depth,
  expandedIds,
  onToggleExpanded,
  displayVertices,
  neighborCounts,
  onExpandNeighbors,
}: TreeRowProps) {
  const { graphSelection, replaceGraphSelection } = useGraphSelection();

  const vertexId = node.vertex.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(vertexId);
  const isSelected = graphSelection.isVertexSelected(vertexId);

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
          "hover:bg-primary-subtle-hover flex items-center gap-1 rounded text-sm",
          isSelected && "bg-brand-100 dark:bg-brand-900",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => onToggleExpanded(vertexId)}
            className="text-text-secondary hover:text-text-primary flex size-5 shrink-0 items-center justify-center"
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
        <button
          type="button"
          onClick={() => replaceGraphSelection({ vertices: [vertexId] })}
          onDoubleClick={() => onExpandNeighbors(vertexId)}
          className="min-w-0 grow truncate py-1 text-left"
        >
          {label}
        </button>
        {unexpandedCount > 0 && (
          <span
            title={`${unexpandedCount} relationships not yet expanded — double click to expand`}
            aria-label={`${unexpandedCount} relationships not yet expanded`}
            className="bg-primary-subtle text-text-secondary mr-1 shrink-0 rounded-full px-1.5 text-xs leading-5 tabular-nums"
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}
