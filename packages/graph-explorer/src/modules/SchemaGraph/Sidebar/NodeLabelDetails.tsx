import type { ComponentPropsWithRef } from "react";

import {
  Chip,
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
  AttributeList,
  DetailsTitle,
  DetailsValue,
  EdgeConnectionRow,
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
      <PanelContent className="space-y-6 p-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <DetailsTitle>{t("node-type")}</DetailsTitle>
            <DetailsValue>{vertexType}</DetailsValue>
          </div>
          <VertexSymbolByType vertexType={vertexType} />
        </div>

        {total != null && (
          <div>
            <DetailsTitle>Total Count</DetailsTitle>
            <DetailsValue>{toHumanString(total)}</DetailsValue>
          </div>
        )}

        <div className="space-y-4">
          <DetailsTitle>{t("edge-connections")}</DetailsTitle>
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
        </div>

        <div className="space-y-4">
          <DetailsTitle className="flex justify-between gap-2">
            {t("properties")}
            <Chip variant="primary-subtle">
              {toHumanString(config.attributes.length)}
            </Chip>
          </DetailsTitle>
          <div>
            {config.attributes.length === 0 ? (
              <DetailsValue>
                No {t("properties").toLocaleLowerCase()}
              </DetailsValue>
            ) : (
              <AttributeList attributes={config.attributes} />
            )}
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}
