import {
  Divider,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { useDisplayVertexTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import SingleNodeStyling from "./SingleNodeStyling";
import { Fragment } from "react/jsx-runtime";
import { SidebarCloseButton } from "../SidebarCloseButton";
import { Virtuoso } from "react-virtuoso";
import NodeStyleDialog from "./NodeStyleDialog";

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
        <Virtuoso
          className="h-full grow"
          data={vtConfigs}
          itemContent={(index, vtConfig) => (
            <Fragment key={vtConfig.type}>
              {index !== 0 ? <Divider /> : null}

              <SingleNodeStyling
                vertexType={vtConfig.type}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          )}
        />
        <NodeStyleDialog />
      </PanelContent>
    </Panel>
  );
}

export default NodesStyling;
