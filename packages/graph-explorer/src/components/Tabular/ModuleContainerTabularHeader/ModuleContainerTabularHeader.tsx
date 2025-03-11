import { cn } from "@/utils";
import { ReactNode } from "react";

import { useWithTheme } from "@/core";
import { GridIcon } from "@/components/icons";
import Select from "@/components/Select";
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
      className={cn(styleWithTheme(defaultStyles), "entities-tabular-header")}
    >
      <div className="title">
        {startAdornment ? (
          <div className="start-adornment">{startAdornment}</div>
        ) : (
          <GridIcon className="icon" />
        )}
        {moduleName}
      </div>
      <div className="select-table">
        <Select
          aria-label="Table"
          value={selectedTable}
          onValueChange={onTableChange}
          options={tables}
        />
      </div>
      <div className="grow" />
      <ExportControl />
    </div>
  );
};

export default ModuleContainerTabularHeader;
