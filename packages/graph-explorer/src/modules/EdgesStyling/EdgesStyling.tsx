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
import { useConfiguration } from "@/core";
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
  const config = useConfiguration();
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
        {config?.edgeTypes.map((edgeType, index) => {
          return (
            <Fragment key={edgeType}>
              {index !== 0 ? <Divider /> : null}

              <SingleEdgeStyling
                edgeType={edgeType}
                opened={customizeEdgeType === edgeType}
                onOpenChanged={open =>
                  onEdgeCustomize(open ? edgeType : undefined)
                }
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
