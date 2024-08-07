import { cx } from "@emotion/css";
import { ReactNode } from "react";

import { useWithTheme } from "../../../core";
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
  const styleWithTheme = useWithTheme();

  return (
    <div
      className={cx(styleWithTheme(defaultStyles), "entities-tabular-header")}
    >
      <div className={"title"}>
        {startAdornment ? (
          <div className={"start-adornment"}>{startAdornment}</div>
        ) : (
          <GridIcon className={"icon"} />
        )}
        {moduleName}
      </div>
      <div className={"select-table"}>
        <Select
          aria-label={"Table"}
          value={selectedTable}
          onChange={option => onTableChange(option as string)}
          options={tables}
          hideError={true}
        />
      </div>
      <div className="grow" />
      <ExportControl />
    </div>
  );
};

export default ModuleContainerTabularHeader;
