import {
  ModuleContainer,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "../../components";
import { useConfiguration, useWithTheme } from "../../core";
import labelsByEngine from "../../utils/labelsByEngine";
import defaultStyles from "./EdgesStyling.style";
import SingleEdgeStyling from "./SingleEdgeStyling";

export type EdgesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
>;

const EdgesStyling = (headerProps: EdgesStylingProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];

  return (
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader
        title={`${labels["edge"]} Styling`}
        {...headerProps}
      />
      <div className={styleWithTheme(defaultStyles())}>
        {config?.edgeTypes.map(edgeType => (
          <SingleEdgeStyling key={edgeType} edgeType={edgeType} />
        ))}
      </div>
    </ModuleContainer>
  );
};

export default EdgesStyling;
