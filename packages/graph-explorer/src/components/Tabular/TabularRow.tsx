import { cn } from "@/utils";

import { MouseEvent, useEffect, useState } from "react";
import type { Row, TableInstance } from "react-table";

import type { TabularProps } from "./Tabular";

const TabularRow = <T extends object>({
  fitRowsVertically,
  rowSelectionMode,
  row,
  tableInstance,
  onMouseOver,
  onMouseOut,
}: Pick<TabularProps<T>, "fitRowsVertically" | "rowSelectionMode"> & {
  tableInstance: TableInstance<T>;
  row: Row<T>;
  onMouseOver?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;
  onMouseOut?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;
}) => {
  const { prepareRow, state } = tableInstance;
  prepareRow(row);

  // Disable selection until resizing animation ends
  const [selectable, setSelectable] = useState(true);
  useEffect(() => {
    if (tableInstance.state.columnResizing.isResizingColumn) {
      setSelectable(false);
      return;
    }

    const timeout = setTimeout(() => {
      setSelectable(true);
    }, 100);

    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [tableInstance.state.columnResizing.isResizingColumn]);

  const { key: _, ...rowProps } = row.getRowProps();

  return (
    <div
      {...rowProps}
      className={cn("row", {
        ["row-grow"]: fitRowsVertically,
        ["row-selectable"]: rowSelectionMode === "row",
        ["row-selected"]: row.isSelected,
      })}
      onClick={() =>
        rowSelectionMode === "row" && selectable && row.toggleRowSelected()
      }
      onMouseOver={event => onMouseOver?.(event, row)}
      onMouseOut={event => onMouseOut?.(event, row)}
    >
      {row.cells.map(cell => {
        const { key, ...cellProps } = cell.getCellProps({
          style: { display: "flex" },
        });
        return (
          <div
            key={key}
            {...cellProps}
            className={cn("cell", `cell-align-${cell.column.align || "left"}`, {
              ["cell-resizing"]:
                cell.column.isResizing ||
                state.columnResizing?.isResizingColumn === cell.column.id,
            })}
          >
            <div
              className={cn("cell-content", {
                ["cell-overflow-ellipsis"]: cell.column.overflow === "ellipsis",
                ["cell-overflow-truncate"]: cell.column.overflow === "truncate",
                ["cell-one-line"]: cell.column.oneLine,
              })}
            >
              {cell.render("Cell")}
            </div>
            {cell.column.canResize && (
              <div
                {...(cell.column.getResizerProps?.() || {})}
                className="cell-resizer"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabularRow;
