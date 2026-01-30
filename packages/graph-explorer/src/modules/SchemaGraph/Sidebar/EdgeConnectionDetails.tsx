import type { ComponentPropsWithRef } from "react";

import {
  Chip,
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
  AttributeList,
  DetailsTitle,
  DetailsValue,
  EdgeConnectionRow,
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
      <PanelContent className="space-y-6 p-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <DetailsTitle>{t("edge-type")}</DetailsTitle>
            <DetailsValue>{edgeConnection.edgeType}</DetailsValue>
          </div>
          <div className="bg-muted text-muted-foreground flex aspect-square h-10 items-center justify-center rounded-md border shadow-xs">
            <EdgeIcon className="size-6" />
          </div>
        </div>

        {total != null && (
          <div>
            <DetailsTitle>Total Count</DetailsTitle>
            <DetailsValue>{toHumanString(total)}</DetailsValue>
          </div>
        )}

        <div className="space-y-4">
          <DetailsTitle>{t("edge-connection")}</DetailsTitle>
          <EdgeConnectionRow edgeConnection={edgeConnection} />
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
