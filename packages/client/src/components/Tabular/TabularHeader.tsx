import { cx } from "@emotion/css";

import { withClassNamePrefix } from "../../core";
import type { HeaderGroup, TableInstance } from "react-table";

import { ArrowDown } from "../icons";
import type { TabularProps } from "./Tabular";

const TabularHeader = <T extends object>({
  classNamePrefix = "ft",
  headerGroup,
  tableInstance,
}: Pick<TabularProps<T>, "classNamePrefix"> & {
  tableInstance: TableInstance<T>;
  headerGroup: HeaderGroup<T>;
}) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const { state } = tableInstance;

  return (
    <div {...headerGroup.getHeaderGroupProps()} className={pfx("row")}>
      {headerGroup.headers.map(column => {
        const { key, style, ...restHeaderProps } = column.getHeaderProps(
          column.getSortByToggleProps({
            style: { display: "flex", cursor: "default" },
          })
        );

        // This wrapper avoids collisions between sort and resize events
        return (
          <div
            key={key}
            style={style}
            className={cx(pfx("header"), {
              [pfx("header-resizing")]:
                column.isResizing ||
                state.columnResizing?.isResizingColumn === column.id,
            })}
          >
            <div
              {...restHeaderProps}
              className={cx(
                pfx("header-label"),
                pfx(`header-label-align-${column.align || "left"}`),
                {
                  [pfx("header-label-sortable")]: column.canSort,
                  [pfx(
                    `header-label-sort-${column.isSortedDesc ? "desc" : "asc"}`
                  )]: column.isSorted,
                }
              )}
            >
              <div
                className={cx({
                  [pfx("header-overflow-ellipsis")]:
                    column.overflow === "ellipsis",
                  [pfx("header-overflow-truncate")]:
                    column.overflow === "truncate",
                })}
              >
                {column.render("Header")}
              </div>
              <div>
                <div
                  className={pfx("header-label-sorter")}
                  style={{
                    opacity: column.isSorted ? 1 : 0,
                    transform: column.isSortedDesc ? "unset" : "rotate(180deg)",
                  }}
                >
                  <ArrowDown width={18} height={18} />
                </div>
              </div>
            </div>
            {column.canFilter && (
              <div className={pfx("header-filter")}>
                {column.render("Filter")}
              </div>
            )}
            {column.canResize && (
              <div
                {...(column.getResizerProps?.() || {})}
                className={pfx("col-resizer")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabularHeader;
