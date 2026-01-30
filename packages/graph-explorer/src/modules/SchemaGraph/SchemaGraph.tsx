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

/** Selection state for schema graph - either a vertex type or edge connection */
export type SchemaGraphSelection = {
  vertexType: VertexType | null;
  edgeConnectionId: EdgeConnectionId | null;
};

export type SchemaGraphProps = {
  onSelectionChange?: (selection: SchemaGraphSelection) => void;
} & Omit<ComponentPropsWithRef<"div">, "children" | "onContextMenu">;

/** Atom for storing the selected graph layout algorithm */
export const schemaGraphLayoutAtom = atom<LayoutName>("F_COSE");

function preventContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();
}

/** Main schema graph visualization component */
export default function SchemaGraph({
  className,
  onSelectionChange,
  ...props
}: SchemaGraphProps) {
  const { nodes, edges } = useSchemaGraphData();
  const styles = useSchemaGraphStyles();
  const layout = useAtomValue(schemaGraphLayoutAtom);

  const [selectedVertexType, setSelectedVertexType] =
    useState<VertexType | null>(null);
  const [selectedEdgeConnectionId, setSelectedEdgeConnectionId] =
    useState<EdgeConnectionId | null>(null);

  const handleSelectionChange = ({ nodeIds, edgeIds }: SelectedElements) => {
    const nodeId = nodeIds.values().next().value;
    const edgeId = edgeIds.values().next().value;

    const vertexType = nodeId ? createVertexType(nodeId) : null;
    const edgeConnectionId = edgeId ? (edgeId as EdgeConnectionId) : null;

    if (vertexType) {
      logger.log("Schema graph: vertex type selected", { vertexType });
    } else if (edgeConnectionId) {
      logger.log("Schema graph: edge connection selected", {
        edgeConnectionId,
      });
    }

    setSelectedVertexType(vertexType);
    setSelectedEdgeConnectionId(edgeConnectionId);

    onSelectionChange?.({ vertexType, edgeConnectionId });
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
                selectedNodesIds={
                  selectedVertexType ? [selectedVertexType] : []
                }
                selectedEdgesIds={
                  selectedEdgeConnectionId ? [selectedEdgeConnectionId] : []
                }
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
        selection={{
          vertexType: selectedVertexType,
          edgeConnectionId: selectedEdgeConnectionId,
        }}
      />
    </div>
  );
}
