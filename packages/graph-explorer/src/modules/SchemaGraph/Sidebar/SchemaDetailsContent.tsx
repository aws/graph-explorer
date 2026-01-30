import {
  GraphIcon,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelHeader,
  PanelTitle,
} from "@/components";
import { useGraphSchema } from "@/core";
import { useTranslations } from "@/hooks";

import type { SchemaGraphSelection } from "../SchemaGraph";

import { EdgeConnectionDetails } from "./EdgeConnectionDetails";
import { NodeLabelDetails } from "./NodeLabelDetails";
import { LABELS } from "@/utils";

export type SchemaDetailsContentProps = {
  selection: SchemaGraphSelection;
  onClearSelection: () => void;
};

/** Displays details for selected vertex type or edge connection in schema graph */
export function SchemaDetailsContent({
  selection,
  onClearSelection,
}: SchemaDetailsContentProps) {
  const t = useTranslations();
  const graphSchema = useGraphSchema();
  const hasSelection = Boolean(
    selection.vertexType || selection.edgeConnectionId,
  );

  // Get the edge connection from the schema
  const edgeConnection = selection.edgeConnectionId
    ? graphSchema.edgeConnections.byEdgeConnectionId.get(
        selection.edgeConnectionId,
      )
    : null;

  if (!hasSelection) {
    return (
      <Panel className="size-full" variant="sidebar">
        <PanelHeader>
          <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
        </PanelHeader>
        <PanelContent className="p-6">
          <PanelEmptyState
            icon={<GraphIcon />}
            title="Empty Selection"
            subtitle={`Select a ${t("node-type").toLocaleLowerCase()} or ${t("edge-type").toLocaleLowerCase()} to see its details`}
          />
        </PanelContent>
      </Panel>
    );
  }

  if (selection.vertexType) {
    return (
      <NodeLabelDetails
        vertexType={selection.vertexType}
        onClose={onClearSelection}
        className="size-full"
      />
    );
  }

  if (edgeConnection) {
    return (
      <EdgeConnectionDetails
        edgeConnection={edgeConnection}
        onClose={onClearSelection}
        className="size-full"
      />
    );
  }

  return null;
}
