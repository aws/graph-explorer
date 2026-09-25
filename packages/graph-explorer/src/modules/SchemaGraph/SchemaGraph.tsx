import { atom, useAtomValue } from "jotai";
import { type ComponentPropsWithRef, type MouseEvent, useState } from "react";

import {
  NoNodeTypesEmptyState,
  Panel,
  PanelContent,
  PanelGroup,
} from "@/components";
import {
  Graph,
  type LayoutName,
  type SelectedElements,
} from "@/components/Graph";
import {
  createVertexType,
  type EdgeConnectionId,
  type VertexType,
} from "@/core";
import { cn, logger } from "@/utils";

import { SchemaGraphToolbar } from "./SchemaGraphToolbar";
import { SchemaExplorerSidebar } from "./Sidebar/SchemaExplorerSidebar";
import { useSchemaViewSidebar } from "./Sidebar/schemaViewLayout";
import { useSchemaGraphData } from "./useSchemaGraphData";
import { useSchemaGraphStyles } from "./useSchemaGraphStyles";

/** A single selected item in the schema graph, either a vertex type or edge connection. */
export type SchemaGraphSelectionItem =
  | { type: "vertex-type"; id: VertexType }
  | { type: "edge-connection"; id: EdgeConnectionId };

/** The current selection state of the schema graph. Null when nothing is selected. */
export type SchemaGraphSelection =
  | SchemaGraphSelectionItem
  | { type: "multiple"; items: SchemaGraphSelectionItem[] }
  | null;

export type SchemaGraphProps = Omit<
  ComponentPropsWithRef<"div">,
  "children" | "onContextMenu"
>;

/** Atom for storing the selected graph layout algorithm */
export const schemaGraphLayoutAtom = atom<LayoutName>("F_COSE");

function preventContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();
}

/** Main schema graph visualization component */
export default function SchemaGraph({ className, ...props }: SchemaGraphProps) {
  const { nodes, edges } = useSchemaGraphData();
  const styles = useSchemaGraphStyles();
  const layout = useAtomValue(schemaGraphLayoutAtom);

  const [selection, setSelection] = useState<SchemaGraphSelection>(null);
  const [graphSelection, setGraphSelection] = useState<SelectedElements | null>(
    null,
  );
  const { autoOpenDetails } = useSchemaViewSidebar();

  const handleSelectionChange = (selected: SelectedElements) => {
    setGraphSelection(selected);

    const newSelection = toSchemaGraphSelection(selected);
    setSelection(newSelection);

    if (shouldAutoOpenDetailsForSelection(newSelection)) {
      autoOpenDetails();
    }

    if (newSelection) {
      const items =
        newSelection.type === "multiple" ? newSelection.items : [newSelection];
      logger.log("Schema graph: selection changed", {
        count: items.length,
        types: items.map(i => i.type),
      });
    }
  };

  const handleSidebarSelectionChange = (item: SchemaGraphSelectionItem) => {
    setSelection(item);
    setGraphSelection(toSelectedElements(item));
  };

  const hasSchemaData = nodes.length > 0;

  return (
    <div
      className={cn("flex size-full min-h-0 flex-1 flex-row", className)}
      {...props}
    >
      <PanelGroup>
        <Panel className="min-h-0 min-w-0 flex-1">
          <SchemaGraphToolbar />
          <PanelContent className="bg-workspace-canvas size-full min-h-0 min-w-0">
            {!hasSchemaData ? (
              <NoNodeTypesEmptyState />
            ) : (
              <Graph
                nodes={nodes}
                edges={edges}
                selectedNodesIds={graphSelection?.nodeIds}
                selectedEdgesIds={graphSelection?.edgeIds}
                onSelectedElementIdsChange={handleSelectionChange}
                styles={styles}
                layout={layout}
                className="size-full"
                onContextMenu={preventContextMenu}
              />
            )}
          </PanelContent>
        </Panel>
      </PanelGroup>

      <SchemaExplorerSidebar
        selection={selection}
        onSelectionChange={handleSidebarSelectionChange}
      />
    </div>
  );
}

/**
 * Whether selecting in the schema graph should auto-open the details panel.
 * Only a single vertex type or edge connection has details to show — a
 * multiple or cleared selection would land on a dead-end empty state, so it
 * does not trigger auto-open (mirrors the graph view's single-selection gate).
 */
export function shouldAutoOpenDetailsForSelection(
  selection: SchemaGraphSelection,
): boolean {
  return selection !== null && selection.type !== "multiple";
}

/** Maps a single schema graph selection item to the graph view's selected elements. */
export function toSelectedElements(
  item: SchemaGraphSelectionItem,
): SelectedElements {
  return {
    nodeIds: new Set(item.type === "vertex-type" ? [item.id] : []),
    edgeIds: new Set(item.type === "edge-connection" ? [item.id] : []),
    groupIds: new Set(),
  };
}

/** Maps raw graph selection elements to a SchemaGraphSelection. */
export function toSchemaGraphSelection(
  selected: SelectedElements,
): SchemaGraphSelection {
  const items: SchemaGraphSelectionItem[] = [];

  for (const nodeId of selected.nodeIds) {
    items.push({ type: "vertex-type", id: createVertexType(nodeId) });
  }
  for (const edgeId of selected.edgeIds) {
    items.push({
      type: "edge-connection",
      id: edgeId as EdgeConnectionId,
    });
  }

  if (items.length === 0) {
    return null;
  }
  if (items.length === 1) {
    return items[0];
  }
  return { type: "multiple", items };
}
