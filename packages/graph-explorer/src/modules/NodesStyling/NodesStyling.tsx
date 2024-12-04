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
  const config = useConfiguration();
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
        {config?.vertexTypes.map((vertexType, index) => {
          return (
            <Fragment key={vertexType}>
              {index !== 0 ? <Divider /> : null}

              <SingleNodeStyling
                vertexType={vertexType}
                opened={customizeNodeType === vertexType}
                onOpenChanged={open =>
                  onNodeCustomize(open ? vertexType : undefined)
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

export default NodesStyling;
