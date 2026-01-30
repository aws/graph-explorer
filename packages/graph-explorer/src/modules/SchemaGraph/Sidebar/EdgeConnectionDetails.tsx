import type { ComponentPropsWithRef } from "react";

import {
  Chip,
  EdgeIcon,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
  toHumanString,
} from "@/components";
import {
  type EdgeConnection,
  useDisplayEdgeTypeConfig,
  useEdgeTypeTotal,
} from "@/core";
import { useTranslations } from "@/hooks";
import { cn } from "@/utils";

import { LABELS } from "./constants";
import {
  AttributeList,
  DetailsTitle,
  DetailsValue,
  EdgeConnectionRow,
} from "./Details";

export type EdgeConnectionDetailsProps = {
  edgeConnection: EdgeConnection;
  onClose: () => void;
} & ComponentPropsWithRef<typeof Panel>;

/** Displays detailed information about an edge connection including properties and total count */
export function EdgeConnectionDetails({
  edgeConnection,
  onClose,
  className,
  ...props
}: EdgeConnectionDetailsProps) {
  const t = useTranslations();
  const config = useDisplayEdgeTypeConfig(edgeConnection.edgeType);
  const total = useEdgeTypeTotal(edgeConnection.edgeType);

  return (
    <Panel className={cn(className)} {...props}>
      <PanelHeader>
        <PanelTitle>{LABELS.SIDEBAR_TITLE}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
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
          <DetailsTitle className="flex justify-between">
            {t("properties")}{" "}
            <Chip variant="primary-subtle">{config.attributes.length}</Chip>
          </DetailsTitle>
          <div>
            {config.attributes.length === 0 ? (
              <DetailsValue>
                No {t("properties").toLocaleLowerCase()} discovered
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
