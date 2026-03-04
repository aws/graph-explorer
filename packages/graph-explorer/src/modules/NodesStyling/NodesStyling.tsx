import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import {
  Divider,
  NoNodeTypesEmptyState,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { useDisplayVertexTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";

import { SidebarCloseButton } from "../SidebarCloseButton";
import SingleNodeStyling from "./SingleNodeStyling";

function NodesStyling() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>{t("nodes-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
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

export default NodesStyling;
