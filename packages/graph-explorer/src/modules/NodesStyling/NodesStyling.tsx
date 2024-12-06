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
import { useDisplayVertexTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import SingleNodeStyling from "./SingleNodeStyling";
import { Fragment } from "react/jsx-runtime";

export type NodesStylingProps = Pick<PanelHeaderCloseButtonProps, "onClose"> & {
  onNodeCustomize(nodeType?: string): void;
  customizeNodeType?: string;
};

const NodesStyling = ({
  customizeNodeType,
  onNodeCustomize,
  onClose,
}: NodesStylingProps) => {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();
  const t = useTranslations();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>{t("nodes-styling.title")}</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="gap-2">
        {vtConfigs.map((vtConfig, index) => {
          return (
            <Fragment key={vtConfig.type}>
              {index !== 0 ? <Divider /> : null}

              <SingleNodeStyling
                vertexType={vtConfig.type}
                opened={customizeNodeType === vtConfig.type}
                onOpen={() => onNodeCustomize(vtConfig.type)}
                onClose={() => onNodeCustomize(undefined)}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          );
        })}
      </PanelContent>
    </Panel>
  );
};

export default NodesStyling;
