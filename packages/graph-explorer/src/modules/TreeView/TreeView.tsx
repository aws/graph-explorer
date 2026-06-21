import { useAtomValue } from "jotai";
import { ChevronDownIcon, ChevronRightIcon, ListTreeIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components";
import {
  type DisplayVertex,
  edgesAtom,
  nodesAtom,
  useDisplayVerticesInCanvas,
  type VertexId,
} from "@/core";
import { useGraphSelection } from "@/modules/GraphViewer/useGraphSelection";
import { cn, LABELS } from "@/utils";

import { buildNotionTree, type NotionTreeNode } from "./buildNotionTree";

export default function TreeView() {
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);
  const displayVertices = useDisplayVerticesInCanvas();

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
};

function TreeRow({
  node,
  depth,
  expandedIds,
  onToggleExpanded,
  displayVertices,
}: TreeRowProps) {
  const { graphSelection, replaceGraphSelection } = useGraphSelection();

  const vertexId = node.vertex.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(vertexId);
  const isSelected = graphSelection.isVertexSelected(vertexId);

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
          className="min-w-0 grow truncate py-1 text-left"
        >
          {label}
        </button>
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}
