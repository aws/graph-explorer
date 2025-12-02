import { cn } from "@/utils";

import { type MouseEvent, useEffect, useState } from "react";
import type { Row, TableInstance } from "react-table";

import type { TabularProps } from "./Tabular";

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

  const isResizing = (columnId: string) =>
    state.columnResizing?.isResizingColumn === columnId;

  return (
    <tr
      {...rowProps}
      className="group/tr text-text-primary data-selected:text-primary-dark data-selected:border-primary-dark data-selected:bg-background-secondary grow-0 border border-x-transparent border-t-transparent data-[selection-mode='row']:hover:cursor-pointer data-[selection-mode='row']:hover:bg-gray-50 data-[selection-mode='row']:data-selected:hover:bg-blue-200/75"
      onClick={() =>
        rowSelectionMode === "row" && selectable && row.toggleRowSelected()
      }
      onMouseOver={event => onMouseOver?.(event, row)}
      onMouseOut={event => onMouseOut?.(event, row)}
      data-selection-mode={rowSelectionMode}
      data-selected={row.isSelected ? "true" : undefined}
    >
      {row.cells.map(cell => {
        const { key, ...cellProps } = cell.getCellProps({
          style: { display: "flex" },
        });
        return (
          <td
            key={key}
            {...cellProps}
            className={cn(
              "group-data-selected/tr:border-primary-dark/25 relative grid items-center border-r px-2 py-1 transition-[border] duration-150 last:border-none data-[align='right']:text-right",
              (cell.column.isResizing || isResizing(cell.column.id)) &&
                "border-primary-dark cursor-col-resize! border-dashed",
            )}
            data-align={cell.column.align}
          >
            <div
              className={cn(
                "w-full overflow-hidden data-[overflow='ellipsis']:text-ellipsis",
                {
                  "break-keep whitespace-nowrap": cell.column.oneLine,
                },
              )}
              data-overflow={cell.column.overflow}
            >
              {cell.render("Cell")}
            </div>
            {cell.column.canResize && (
              <div
                {...(cell.column.getResizerProps?.() || {})}
                className="absolute top-0 right-0 z-1 h-full w-2"
              />
            )}
          </td>
        );
      })}
    </tr>
  );
};

export default TabularRow;
