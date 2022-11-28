import {
  ModuleContainer,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "../../components";
import { useConfiguration, useWithTheme } from "../../core";
import useTranslations from "../../hooks/useTranslations";
import defaultStyles from "./EdgesStyling.style";
import SingleEdgeStyling from "./SingleEdgeStyling";

export type EdgesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  onEdgeCustomize(edgeType?: string): void;
  customizeEdgeType?: string;
};

const EdgesStyling = ({
  customizeEdgeType,
  onEdgeCustomize,
  ...headerProps
}: EdgesStylingProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const t = useTranslations();

  return (
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader
        title={t("edges-styling.title")}
        {...headerProps}
      />
      <div className={styleWithTheme(defaultStyles())}>
        {config?.edgeTypes.map(edgeType => (
          <SingleEdgeStyling
            key={edgeType}
            edgeType={edgeType}
            opened={customizeEdgeType === edgeType}
            onOpen={() => onEdgeCustomize(edgeType)}
            onClose={() => onEdgeCustomize(undefined)}
          />
        ))}
      </div>
    </ModuleContainer>
  );
};

export default EdgesStyling;
