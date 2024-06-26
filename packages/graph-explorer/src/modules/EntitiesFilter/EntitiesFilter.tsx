import { cx } from "@emotion/css";
import type { ModuleContainerHeaderProps } from "../../components";
import {
  CheckboxList,
  ModuleContainer,
  ModuleContainerHeader,
} from "../../components";
import { useWithTheme } from "../../core";
import useTranslations from "../../hooks/useTranslations";
import defaultStyles from "./EntitiesFilter.styles";
import useFiltersConfig from "./useFiltersConfig";

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
    >
      <ModuleContainerHeader
        title={title}
        variant={"sidebar"}
        {...headerProps}
      />
      {connectionTypes.length > 0 && (
        <div className={"checkbox-list-container"}>
          <CheckboxList
            title={t("entities-filter.edge-types")}
            selectedIds={selectedConnectionTypes}
            checkboxes={connectionTypes}
            onChange={onChangeConnectionTypes}
            onChangeAll={onChangeAllConnectionTypes}
          />
        </div>
      )}
      <div className={"section-divider"} />
      {vertexTypes.length > 0 && (
        <div className={"checkbox-list-container"}>
          <CheckboxList
            title={t("entities-filter.node-types")}
            selectedIds={selectedVertexTypes}
            checkboxes={vertexTypes}
            onChange={onChangeVertexTypes}
            onChangeAll={onChangeAllVertexTypes}
          />
        </div>
      )}
    </ModuleContainer>
  );
};

export default EntitiesFilter;
