import { cx } from "@emotion/css";
import type { ModuleContainerHeaderProps } from "../../components";
import {
  CheckboxList,
  Divider,
  ModuleContainer,
  ModuleContainerContent,
  ModuleContainerHeader,
} from "../../components";
import { useWithTheme } from "../../core";
import useTranslations from "../../hooks/useTranslations";
import defaultStyles from "./EntitiesFilter.styles";
import useFiltersConfig from "./useFiltersConfig";
import { PropsWithChildren } from "react";

export type EntitiesFilterProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
};

const EntitiesFilter = ({
  title = "Entities Filter",
  ...headerProps
}: EntitiesFilterProps) => {
  const t = useTranslations();
  const styleWithTheme = useWithTheme();

  const {
    selectedVertexTypes,
    vertexTypes,
    onChangeVertexTypes,
    onChangeAllVertexTypes,
    selectedConnectionTypes,
    connectionTypes,
    onChangeConnectionTypes,
    onChangeAllConnectionTypes,
  } = useFiltersConfig();

  return (
    <ModuleContainer
      className={cx(styleWithTheme(defaultStyles), "entities-filters")}
      variant="sidebar"
    >
      <ModuleContainerHeader
        title={title}
        variant={"sidebar"}
        {...headerProps}
      />
      <ModuleContainerContent>
        {connectionTypes.length > 0 && (
          <CheckboxListContainer>
            <CheckboxList
              title={t("entities-filter.edge-types")}
              selectedIds={selectedConnectionTypes}
              checkboxes={connectionTypes}
              onChange={onChangeConnectionTypes}
              onChangeAll={onChangeAllConnectionTypes}
            />
          </CheckboxListContainer>
        )}
        <Divider />
        {vertexTypes.length > 0 && (
          <CheckboxListContainer>
            <CheckboxList
              title={t("entities-filter.node-types")}
              selectedIds={selectedVertexTypes}
              checkboxes={vertexTypes}
              onChange={onChangeVertexTypes}
              onChangeAll={onChangeAllVertexTypes}
            />
          </CheckboxListContainer>
        )}
      </ModuleContainerContent>
    </ModuleContainer>
  );
};

function CheckboxListContainer(props: PropsWithChildren) {
  return <div className="w-full px-3 py-2">{props.children}</div>;
}

export default EntitiesFilter;
