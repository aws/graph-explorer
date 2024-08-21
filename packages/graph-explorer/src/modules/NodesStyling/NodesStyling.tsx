import {
  Divider,
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "@/components";
import { useConfiguration } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import SingleNodeStyling from "./SingleNodeStyling";
import { Fragment } from "react/jsx-runtime";

export type NodesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  onNodeCustomize(nodeType?: string): void;
  customizeNodeType?: string;
};

const NodesStyling = ({
  customizeNodeType,
  onNodeCustomize,
  ...headerProps
}: NodesStylingProps) => {
  const config = useConfiguration();
  const t = useTranslations();

  return (
    <ModuleContainer variant="sidebar">
      <ModuleContainerHeader
        title={t("nodes-styling.title")}
        {...headerProps}
      />
      <ModuleContainerContent className="flex flex-col gap-2">
        {config?.vertexTypes.map((vertexType, index) => {
          return (
            <Fragment key={vertexType}>
              {index !== 0 ? <Divider /> : null}

              <SingleNodeStyling
                vertexType={vertexType}
                opened={customizeNodeType === vertexType}
                onOpen={() => onNodeCustomize(vertexType)}
                onClose={() => onNodeCustomize(undefined)}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          );
        })}
      </ModuleContainerContent>
    </ModuleContainer>
  );
};

export default NodesStyling;
