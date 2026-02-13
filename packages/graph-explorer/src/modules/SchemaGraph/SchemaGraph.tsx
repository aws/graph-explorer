import { atom, useAtomValue } from "jotai";
import { type ComponentPropsWithRef, type MouseEvent, useState } from "react";

import { Panel, PanelContent, PanelEmptyState, PanelGroup } from "@/components";
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

  const handleSelectionChange = (selected: SelectedElements) => {
    setGraphSelection(selected);

    const newSelection = toSchemaGraphSelection(selected);
    setSelection(newSelection);

    if (newSelection) {
      const items =
        newSelection.type === "multiple" ? newSelection.items : [newSelection];
      logger.log("Schema graph: selection changed", {
        count: items.length,
        types: items.map(i => i.type),
      });
    }
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
          <PanelContent className="bg-background-secondary size-full min-h-0 min-w-0">
            {!hasSchemaData ? (
              <PanelEmptyState
                title="No Schema Data"
                subtitle="Synchronize your connection to discover the schema."
                className="p-6"
              />
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

      <SchemaExplorerSidebar selection={selection} />
    </div>
  );
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
