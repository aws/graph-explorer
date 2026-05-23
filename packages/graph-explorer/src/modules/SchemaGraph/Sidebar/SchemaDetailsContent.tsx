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
import { LABELS } from "@/utils";

import type { SchemaGraphSelection } from "../SchemaGraph";

import { EdgeConnectionDetails } from "./EdgeConnectionDetails";
import { NodeLabelDetails } from "./NodeLabelDetails";

export type SchemaDetailsContentProps = {
  selection: SchemaGraphSelection;
};

/** Displays details for selected vertex type or edge connection in schema graph */
export function SchemaDetailsContent({ selection }: SchemaDetailsContentProps) {
  const t = useTranslations();
  const graphSchema = useGraphSchema();

  if (!selection) {
    return (
      <Panel className="size-full" variant="sidebar">
        <PanelHeader>
          <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
        </PanelHeader>
        <PanelContent className="p-6">
          <PanelEmptyState
            icon={<GraphIcon />}
            title="Empty Selection"
            subtitle={`Select a ${t("node-type").toLocaleLowerCase()} or ${t("edge-connection").toLocaleLowerCase()} to see its details`}
          />
        </PanelContent>
      </Panel>
    );
  }

  if (selection.type === "multiple") {
    return (
      <Panel className="size-full" variant="sidebar">
        <PanelHeader>
          <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
        </PanelHeader>
        <PanelContent className="p-6">
          <PanelEmptyState
            icon={<GraphIcon />}
            title="Multiple Selection"
            subtitle="Select a single item to see its details"
          />
        </PanelContent>
      </Panel>
    );
  }

  if (selection.type === "vertex-type") {
    return <NodeLabelDetails vertexType={selection.id} className="size-full" />;
  }

  const edgeConnection = graphSchema.edgeConnections.byEdgeConnectionId.get(
    selection.id,
  );

  if (edgeConnection) {
    return (
      <EdgeConnectionDetails
        edgeConnection={edgeConnection}
        className="size-full"
      />
    );
  }

  return null;
}
