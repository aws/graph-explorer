import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import {
  Divider,
  NoEdgeTypesEmptyState,
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components";
import { useDisplayEdgeTypeConfigs } from "@/core";
import { useTranslations } from "@/hooks";
import SingleEdgeStyling from "@/modules/EdgesStyling/SingleEdgeStyling";

/** Styling panel for edge types in the schema explorer sidebar. */
export function SchemaEdgesStyling() {
  const etConfigMap = useDisplayEdgeTypeConfigs();
  const etConfigs = etConfigMap.values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar" className="size-full">
      <PanelHeader>
        <PanelTitle>{t("edges-styling.title")}</PanelTitle>
      </PanelHeader>
      <PanelContent className="gap-2">
        {etConfigs.length === 0 ? (
          <NoEdgeTypesEmptyState />
        ) : (
          <Virtuoso
            className="h-full grow"
            data={etConfigs}
            itemContent={(index, etConfig) => (
              <Fragment key={etConfig.type}>
                {index !== 0 ? <Divider /> : null}
                <SingleEdgeStyling
                  edgeType={etConfig.type}
                  className="px-3 pt-2 pb-3"
                />
              </Fragment>
            )}
          />
        )}
      </PanelContent>
    </Panel>
  );
}
