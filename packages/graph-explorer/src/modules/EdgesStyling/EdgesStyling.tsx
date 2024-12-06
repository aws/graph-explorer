import { Fragment } from "react/jsx-runtime";
import {
  Divider,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderCloseButtonProps,
  PanelTitle,
} from "@/components";
import { useDisplayEdgeTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import SingleEdgeStyling from "./SingleEdgeStyling";

export type EdgesStylingProps = Pick<PanelHeaderCloseButtonProps, "onClose"> & {
  onEdgeCustomize(edgeType?: string): void;
  customizeEdgeType?: string;
};

const EdgesStyling = ({
  customizeEdgeType,
  onEdgeCustomize,
  onClose,
}: EdgesStylingProps) => {
  const etConfigs = useDisplayEdgeTypeConfigs().values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>{t("edges-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
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
};

export default EdgesStyling;
