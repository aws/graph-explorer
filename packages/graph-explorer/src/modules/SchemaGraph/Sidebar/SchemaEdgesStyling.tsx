import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import {
  Divider,
  NoEdgeTypesEmptyState,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
} from "@/components";
import { useDisplayEdgeTypeConfigs } from "@/core";
import { useTranslations } from "@/hooks";
import SingleEdgeStyling from "@/modules/EdgesStyling/SingleEdgeStyling";

import { useSchemaViewSidebar } from "./schemaViewLayout";

/** Styling panel for edge types in the schema view sidebar. */
export function SchemaEdgesStyling() {
  const etConfigMap = useDisplayEdgeTypeConfigs();
  const etConfigs = etConfigMap.values().toArray();
  const t = useTranslations();
  const { closeSidebar } = useSchemaViewSidebar();

  return (
    <Panel variant="sidebar" className="size-full">
      <PanelHeader>
        <PanelTitle>{t("edges-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={closeSidebar} />
        </PanelHeaderActions>
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
