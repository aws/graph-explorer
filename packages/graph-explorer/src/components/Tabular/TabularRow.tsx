import { cn } from "@/utils";

import { type MouseEvent, useEffect, useState } from "react";
import type { Row, TableInstance } from "react-table";

import type { TabularProps } from "./Tabular";
import { TableColumnResizer } from "./TableColumnResizer";

const TabularRow = <T extends object>({
  rowSelectionMode,
  row,
  tableInstance,
  onMouseOver,
  onMouseOut,
}: Pick<TabularProps<T>, "rowSelectionMode"> & {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      className={cn("grow-0! border-b", {
        ["hover:bg-muted hover:cursor-pointer"]: rowSelectionMode === "row",
        ["hover:bg-brand-100! bg-brand-50"]: row.isSelected,
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
              ["border-r-primary-main!"]:
                cell.column.isResizing ||
                state.columnResizing?.isResizingColumn === cell.column.id,
            })}
          >
            <div
              className={cn("cell-content py-1", {
                ["cell-overflow-ellipsis"]: cell.column.overflow === "ellipsis",
                ["cell-overflow-truncate"]: cell.column.overflow === "truncate",
                ["cell-one-line"]: cell.column.oneLine,
              })}
            >
              {cell.render("Cell")}
            </div>
            {cell.column.canResize && (
              <TableColumnResizer
                {...(cell.column.getResizerProps?.() || {})}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabularRow;
