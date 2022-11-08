import {
  ModuleContainer,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "../../components";
import { useConfiguration, useWithTheme } from "../../core";
import labelsByEngine from "../../utils/labelsByEngine";
import defaultStyles from "./NodesStyling.style";
import SingleNodeStyling from "./SingleNodeStyling";

export type NodesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
>;

const NodesStyling = (headerProps: NodesStylingProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];

  return (
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader
        title={`${labels["node"]} Styling`}
        {...headerProps}
      />
      <div className={styleWithTheme(defaultStyles())}>
        {config?.vertexTypes.map(vertexType => (
          <SingleNodeStyling key={vertexType} vertexType={vertexType} />
        ))}
      </div>
    </ModuleContainer>
  );
};

export default NodesStyling;
