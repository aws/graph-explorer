import { cx } from "@emotion/css";

import { MouseEvent, useEffect, useState } from "react";
import type { Row, TableInstance } from "react-table";
import { withClassNamePrefix } from "../../core";

import type { TabularProps } from "./Tabular";

const TabularRow = <T extends object>({
  classNamePrefix = "ft",
  fitRowsVertically,
  rowSelectionMode,
  row,
  tableInstance,
  onMouseOver,
  onMouseOut,
}: Pick<
  TabularProps<T>,
  "classNamePrefix" | "fitRowsVertically" | "rowSelectionMode"
> & {
  tableInstance: TableInstance<T>;
  row: Row<T>;
  onMouseOver?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;
  onMouseOut?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;
}) => {
  const pfx = withClassNamePrefix(classNamePrefix);
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

  return (
    <div
      {...row.getRowProps()}
      className={cx(pfx("row"), {
        [pfx("row-grow")]: fitRowsVertically,
        [pfx("row-selectable")]: rowSelectionMode === "row",
        [pfx("row-selected")]: row.isSelected,
      })}
      onClick={() =>
        rowSelectionMode === "row" && selectable && row.toggleRowSelected()
      }
      onMouseOver={event => onMouseOver?.(event, row)}
      onMouseOut={event => onMouseOut?.(event, row)}
    >
      {row.cells.map(cell => {
        return (
          // eslint-disable-next-line react/jsx-key
          <div
            {...cell.getCellProps({ style: { display: "flex" } })}
            className={cx(
              pfx("cell"),
              pfx(`cell-align-${cell.column.align || "left"}`),
              {
                [pfx("cell-resizing")]:
                  cell.column.isResizing ||
                  state.columnResizing?.isResizingColumn === cell.column.id,
              }
            )}
          >
            <div
              className={cx(pfx("cell-content"), {
                [pfx("cell-overflow-ellipsis")]:
                  cell.column.overflow === "ellipsis",
                [pfx("cell-overflow-truncate")]:
                  cell.column.overflow === "truncate",
                [pfx("cell-one-line")]: cell.column.oneLine,
              })}
            >
              {cell.render("Cell")}
            </div>
            {cell.column.canResize && (
              <div
                {...(cell.column.getResizerProps?.() || {})}
                className={pfx("cell-resizer")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabularRow;
