import type { ComponentPropsWithRef } from "react";

import {
  EdgeIcon,
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  toHumanString,
} from "@/components";
import {
  type EdgeConnection,
  useDisplayEdgeTypeConfig,
  useEdgeTypeTotal,
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

export type EdgeConnectionDetailsProps = {
  edgeConnection: EdgeConnection;
} & ComponentPropsWithRef<typeof Panel>;

/** Displays detailed information about an edge connection including properties and total count */
export function EdgeConnectionDetails({
  edgeConnection,
  ...props
}: EdgeConnectionDetailsProps) {
  const t = useTranslations();
  const config = useDisplayEdgeTypeConfig(edgeConnection.edgeType);
  const total = useEdgeTypeTotal(edgeConnection.edgeType);

  return (
    <Panel {...props}>
      <PanelHeader>
        <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
      </PanelHeader>
      <PanelContent className="space-y-8 p-3">
        <div className="flex flex-row items-center justify-between">
          <DetailsHeader>
            <DetailsTitle>{t("edge-type")}</DetailsTitle>
            <DetailsValue>{edgeConnection.edgeType}</DetailsValue>
          </DetailsHeader>
          <div className="bg-muted text-muted-foreground flex aspect-square h-10 items-center justify-center rounded-md border shadow-xs">
            <EdgeIcon className="size-6" />
          </div>
        </div>

        {total != null && (
          <DetailsHeader>
            <DetailsTitle>Total Count</DetailsTitle>
            <DetailsValue>{toHumanString(total)}</DetailsValue>
          </DetailsHeader>
        )}

        <Details>
          <DetailsHeader>
            <DetailsTitle>{t("edge-connection")}</DetailsTitle>
            <DetailsDescription>
              The currently selected {t("edge-connection").toLowerCase()}.
            </DetailsDescription>
          </DetailsHeader>
          <EdgeConnectionRow edgeConnection={edgeConnection} />
        </Details>

        <PropertiesDetails attributes={config.attributes} />
      </PanelContent>
    </Panel>
  );
}
