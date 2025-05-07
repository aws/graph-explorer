import { Fragment } from "react/jsx-runtime";
import {
  Divider,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
} from "@/components";
import { useDisplayEdgeTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import SingleEdgeStyling from "./SingleEdgeStyling";
import { SidebarCloseButton } from "../SidebarCloseButton";
import EdgeStyleDialog from "./EdgeStyleDialog";
import { Virtuoso } from "react-virtuoso";

function EdgesStyling() {
  const etConfigMap = useDisplayEdgeTypeConfigs();
  const etConfigs = etConfigMap.values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>{t("edges-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <SidebarCloseButton />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-2">
        <Virtuoso
          className="h-full grow"
          data={etConfigs}
          itemContent={(index, etConfig) => (
            <Fragment key={etConfig.type}>
              {index !== 0 ? <Divider /> : null}

              <SingleEdgeStyling
                edgeType={etConfig.type}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          )}
        />
        <EdgeStyleDialog />
      </PanelContent>
    </Panel>
  );
}

export default EdgesStyling;
