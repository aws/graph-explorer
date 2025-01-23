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

export type EdgesStylingProps = {
  onEdgeCustomize(edgeType?: string): void;
  customizeEdgeType?: string;
};

function EdgesStyling({
  customizeEdgeType,
  onEdgeCustomize,
}: EdgesStylingProps) {
  const etConfigs = useDisplayEdgeTypeConfigs().values().toArray();
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
        {etConfigs.map((etConfig, index) => {
          return (
            <Fragment key={etConfig.type}>
              {index !== 0 ? <Divider /> : null}

              <SingleEdgeStyling
                edgeType={etConfig.type}
                opened={customizeEdgeType === etConfig.type}
                onOpen={() => onEdgeCustomize(etConfig.type)}
                onClose={() => onEdgeCustomize(undefined)}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          );
        })}
      </PanelContent>
    </Panel>
  );
}

export default EdgesStyling;
