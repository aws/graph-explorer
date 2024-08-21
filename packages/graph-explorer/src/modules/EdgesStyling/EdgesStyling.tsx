import { Fragment } from "react/jsx-runtime";
import {
  Divider,
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
  ModuleContainerHeaderProps,
} from "@/components";
import { useConfiguration } from "@/core";
import useTranslations from "@/hooks/useTranslations";
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
  const t = useTranslations();

  return (
    <ModuleContainer variant="sidebar">
      <ModuleContainerHeader
        title={t("edges-styling.title")}
        {...headerProps}
      />
      <ModuleContainerContent className="flex flex-col gap-2">
        {config?.edgeTypes.map((edgeType, index) => {
          return (
            <Fragment key={edgeType}>
              {index !== 0 ? <Divider /> : null}

              <SingleEdgeStyling
                edgeType={edgeType}
                opened={customizeEdgeType === edgeType}
                onOpen={() => onEdgeCustomize(edgeType)}
                onClose={() => onEdgeCustomize(undefined)}
                className="px-3 pb-3 pt-2"
              />
            </Fragment>
          );
        })}
      </ModuleContainerContent>
    </ModuleContainer>
  );
};

export default EdgesStyling;
