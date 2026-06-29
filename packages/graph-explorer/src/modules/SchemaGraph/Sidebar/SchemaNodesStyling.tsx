import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import {
  Divider,
  NoNodeTypesEmptyState,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
} from "@/components";
import { useDisplayVertexTypeConfigs } from "@/core";
import { useTranslations } from "@/hooks";
import SingleNodeStyling from "@/modules/NodesStyling/SingleNodeStyling";

import { useSchemaViewSidebar } from "./schemaViewLayout";

/** Styling panel for node types in the schema view sidebar. */
export function SchemaNodesStyling() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();
  const t = useTranslations();
  const { closeSidebar } = useSchemaViewSidebar();

  return (
    <Panel variant="sidebar" className="size-full">
      <PanelHeader>
        <PanelTitle>{t("nodes-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={closeSidebar} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="gap-2">
        {vtConfigs.length === 0 ? (
          <NoNodeTypesEmptyState />
        ) : (
          <Virtuoso
            className="h-full grow"
            data={vtConfigs}
            itemContent={(index, vtConfig) => (
              <Fragment key={vtConfig.type}>
                {index !== 0 ? <Divider /> : null}
                <SingleNodeStyling
                  vertexType={vtConfig.type}
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
