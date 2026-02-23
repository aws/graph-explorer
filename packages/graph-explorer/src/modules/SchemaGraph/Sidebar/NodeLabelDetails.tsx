import type { ComponentPropsWithRef } from "react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  toHumanString,
  VertexSymbolByType,
} from "@/components";
import {
  createEdgeConnectionId,
  useDisplayVertexTypeConfig,
  useGraphSchema,
  useVertexTypeTotal,
  type VertexType,
} from "@/core";
import { useTranslations } from "@/hooks";
import { LABELS } from "@/utils";

import {
  Details,
  DetailsDescription,
  DetailsHeader,
  DetailsTitle,
  DetailsValue,
  EdgeConnectionRow,
  PropertiesDetails,
} from "./Details";

export type NodeLabelDetailsProps = {
  vertexType: VertexType;
} & ComponentPropsWithRef<typeof Panel>;

/** Displays detailed information about a vertex type including properties and edge connections */
export function NodeLabelDetails({
  vertexType,
  ...props
}: NodeLabelDetailsProps) {
  const t = useTranslations();
  const graphSchema = useGraphSchema();
  const config = useDisplayVertexTypeConfig(vertexType);
  const total = useVertexTypeTotal(vertexType);

  const edgeConnections =
    graphSchema.edgeConnections.byVertexType.get(vertexType);

  return (
    <Panel {...props}>
      <PanelHeader>
        <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
      </PanelHeader>
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
            <DetailsDescription>
              All discovered {t("edge-connections").toLowerCase()} related to
              this {t("node-type").toLowerCase()}.
            </DetailsDescription>
          </DetailsHeader>
          <ul className="space-y-3">
            {edgeConnections?.map(edgeConnection => (
              <li key={createEdgeConnectionId(edgeConnection)}>
                <EdgeConnectionRow
                  edgeConnection={edgeConnection}
                  selectedVertexType={vertexType}
                />
              </li>
            )) ?? (
              <li>
                <DetailsValue>
                  No {t("edge-connections").toLocaleLowerCase()}
                </DetailsValue>
              </li>
            )}
          </ul>
        </Details>

        <PropertiesDetails attributes={config.attributes} />
      </PanelContent>
    </Panel>
  );
}
