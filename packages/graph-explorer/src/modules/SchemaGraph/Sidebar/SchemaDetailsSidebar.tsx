import { Activity, type ComponentPropsWithRef } from "react";

import { useGraphSchema } from "@/core";
import { cn, isVisible } from "@/utils";

import type { SchemaGraphSelection } from "../SchemaGraph";

import { EdgeConnectionDetails } from "./EdgeConnectionDetails";
import { NodeLabelDetails } from "./NodeLabelDetails";

export type SchemaDetailsSidebarProps = {
  selection: SchemaGraphSelection;
  onClose: () => void;
};

export function SchemaDetailsSidebar({
  selection,
  onClose,
  className,
}: SchemaDetailsSidebarProps & ComponentPropsWithRef<"div">) {
  const graphSchema = useGraphSchema();
  const hasSelection = Boolean(
    selection.vertexType || selection.edgeConnectionId,
  );

  // Verify the edge connection exists in the schema
  const edgeConnection = selection.edgeConnectionId
    ? graphSchema.edgeConnections.byEdgeConnectionId.get(
        selection.edgeConnectionId,
      )
    : null;

  return (
    <Activity mode={isVisible(hasSelection)}>
      <div className={cn("min-w-72", className)}>
        {selection.vertexType && (
          <NodeLabelDetails
            vertexType={selection.vertexType}
            onClose={onClose}
            className="max-w-sm min-w-72 rounded-xl shadow-lg"
          />
        )}
        {edgeConnection && (
          <EdgeConnectionDetails
            edgeConnection={edgeConnection}
            onClose={onClose}
            className="max-w-sm min-w-72 rounded-xl shadow-lg"
          />
        )}
      </div>
    </Activity>
  );
}
