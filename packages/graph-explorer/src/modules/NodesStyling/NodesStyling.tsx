import {
  ModuleContainer,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "../../components";
import { useConfiguration, useWithTheme } from "../../core";
import useTranslations from "../../hooks/useTranslations";
import defaultStyles from "./NodesStyling.style";
import SingleNodeStyling from "./SingleNodeStyling";

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
  const styleWithTheme = useWithTheme();

  return (
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader
        title={t("nodes-styling.title")}
        {...headerProps}
      />
      <div className={styleWithTheme(defaultStyles())}>
        {config?.vertexTypes.map(vertexType => (
          <SingleNodeStyling
            key={vertexType}
            vertexType={vertexType}
            opened={customizeNodeType === vertexType}
            onOpen={() => onNodeCustomize(vertexType)}
            onClose={() => onNodeCustomize(undefined)}
          />
        ))}
      </div>
    </ModuleContainer>
  );
};

export default NodesStyling;
