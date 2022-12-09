import { cx } from "@emotion/css";
import { ReactNode } from "react";

import { useWithTheme, withClassNamePrefix } from "../../../core";
import { GridIcon } from "../../icons";
import Select from "../../Select";
import { ExportControl } from "../controls";

import defaultStyles from "./ModuleContainerTabularHeader.styles";

export type EntitiesTabularHeaderProps = {
  moduleName?: string;
  startAdornment?: ReactNode;
  tables: { label: string; value: string }[];
  selectedTable: string;
  onTableChange(value: string): void;
};

const ModuleContainerTabularHeader = ({
  tables,
  startAdornment,
  selectedTable,
  onTableChange,
  moduleName = "Table View",
}: EntitiesTabularHeaderProps) => {
  const pfx = withClassNamePrefix("ft");
  const styleWithTheme = useWithTheme();

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles("ft")),
        pfx("entities-tabular-header")
      )}
    >
      <div className={pfx("title")}>
        {startAdornment ? (
          <div className={pfx("start-adornment")}>{startAdornment}</div>
        ) : (
          <GridIcon className={pfx("icon")} />
        )}
        {moduleName}
      </div>
      <div className={pfx("select-table")}>
        <Select
          aria-label={"Table"}
          value={selectedTable}
          onChange={option => onTableChange(option as string)}
          options={tables}
          hideError={true}
        />
      </div>
      <div className={pfx("space")} />
      <ExportControl />
    </div>
  );
};

export default ModuleContainerTabularHeader;
