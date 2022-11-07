import { cx } from "@emotion/css";
import type { ModuleContainerHeaderProps } from "../../components";
import {
  CheckboxList,
  ModuleContainer,
  ModuleContainerHeader,
} from "../../components";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import labelsByEngine from "../../utils/labelsByEngine";
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
  const config = useConfiguration();
  const pfx = withClassNamePrefix("ft");
  const styleWithTheme = useWithTheme();

  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];

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
      className={cx(
        styleWithTheme(defaultStyles("ft")),
        pfx("entities-filters")
      )}
    >
      <ModuleContainerHeader
        title={title}
        variant={"sidebar"}
        {...headerProps}
      />
      {connectionTypes.length > 0 && (
        <div className={pfx("checkbox-list-container")}>
          <CheckboxList
            title={labels["edges-types"]}
            selectedIds={selectedConnectionTypes}
            checkboxes={connectionTypes}
            onChange={onChangeConnectionTypes}
            onChangeAll={onChangeAllConnectionTypes}
          />
        </div>
      )}
      <div className={pfx("section-divider")} />
      {vertexTypes.length > 0 && (
        <div className={pfx("checkbox-list-container")}>
          <CheckboxList
            title={labels["nodes-types"]}
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
