import type { ComponentPropsWithRef } from "react";

import {
  Panel,
  PanelContent,
  toHumanString,
  VertexSymbolByType,
} from "@/components";
import {
  createEdgeConnectionId,
  useActiveSchema,
  useDisplayVertexTypeConfig,
  useGraphSchema,
  useVertexTypeTotal,
  type VertexType,
} from "@/core";
import { useTranslations } from "@/hooks";

import type { SchemaGraphSelectionItem } from "../SchemaGraph";

import {
  Details,
  DetailsHeader,
  DetailsTitle,
  DetailsValue,
  EdgeConnectionRow,
  PropertiesDetails,
} from "./Details";
import { DetailsPanelHeader } from "./DetailsPanelHeader";
import { SchemaDiscoveryAlert } from "./SchemaDiscoveryAlert";

export type NodeLabelDetailsProps = {
  vertexType: VertexType;
  onSelectionChange?: (item: SchemaGraphSelectionItem) => void;
} & ComponentPropsWithRef<typeof Panel>;

/** Displays detailed information about a vertex type including properties and edge connections */
export function NodeLabelDetails({
  vertexType,
  onSelectionChange,
  ...props
}: NodeLabelDetailsProps) {
  const t = useTranslations();
  const activeSchema = useActiveSchema();
  const graphSchema = useGraphSchema();
  const config = useDisplayVertexTypeConfig(vertexType);
  const total = useVertexTypeTotal(vertexType);

  const edgeConnections =
    graphSchema.edgeConnections.byVertexType.get(vertexType);
  const notDiscovered = activeSchema.edgeConnections == null;

  return (
    <Panel {...props}>
      <DetailsPanelHeader />
      <PanelContent className="space-y-8 p-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <DetailsHeader>
            <DetailsTitle>{t("node-type")}</DetailsTitle>
            <DetailsValue>{vertexType}</DetailsValue>
          </DetailsHeader>
          <VertexSymbolByType vertexType={vertexType} />
        </div>

        {total != null && (
          <DetailsHeader>
            <DetailsTitle>Total Count</DetailsTitle>
            <DetailsValue>{toHumanString(total)}</DetailsValue>
          </DetailsHeader>
        )}

        <Details>
          <DetailsHeader>
            <DetailsTitle>{t("edge-connections")}</DetailsTitle>
          </DetailsHeader>
          <ul className="space-y-3">
            {edgeConnections?.map(edgeConnection => (
              <li key={createEdgeConnectionId(edgeConnection)}>
                <EdgeConnectionRow
                  edgeConnection={edgeConnection}
                  selectedVertexType={vertexType}
                  onSelectionChange={onSelectionChange}
                />
              </li>
            )) ?? (
              <li>
                <DetailsValue>
                  {notDiscovered
                    ? `${t("edge-connections")} were not discovered`
                    : `No ${t("edge-connections").toLocaleLowerCase()}`}
                </DetailsValue>
              </li>
            )}
          </ul>
        </Details>

        <PropertiesDetails attributes={config.attributes} />

        <SchemaDiscoveryAlert />
      </PanelContent>
    </Panel>
  );
}
