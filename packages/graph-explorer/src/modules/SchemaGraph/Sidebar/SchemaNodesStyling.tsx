import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import {
  Divider,
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components";
import { useDisplayVertexTypeConfigs } from "@/core";
import { useTranslations } from "@/hooks";
import SingleNodeStyling from "@/modules/NodesStyling/SingleNodeStyling";

/** Styling panel for node types in the schema explorer sidebar. */
export function SchemaNodesStyling() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar" className="size-full">
      <PanelHeader>
        <PanelTitle>{t("nodes-styling.title")}</PanelTitle>
      </PanelHeader>
      <PanelContent className="gap-2">
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
      </PanelContent>
    </Panel>
  );
}
