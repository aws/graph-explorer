import { cn } from "@/utils";

import type { HeaderGroup, TableInstance } from "react-table";

import { ArrowDown } from "@/components/icons";

const TabularHeader = <T extends object>({
  headerGroup,
  tableInstance,
}: {
  tableInstance: TableInstance<T>;
  headerGroup: HeaderGroup<T>;
}) => {
  const { state } = tableInstance;
  const { key, ...otherProps } = headerGroup.getHeaderGroupProps();

  return (
    <div key={key} {...otherProps} className="row">
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
            className={cn("header", {
              ["header-resizing"]:
                column.isResizing ||
                state.columnResizing?.isResizingColumn === column.id,
            })}
          >
            <div
              {...restHeaderProps}
              className={cn(
                "header-label",
                `header-label-align-${column.align || "left"}`,
                {
                  ["header-label-sortable"]: column.canSort,
                  [`header-label-sort-${column.isSortedDesc ? "desc" : "asc"}`]:
                    column.isSorted,
                }
              )}
            >
              <div
                className={cn({
                  ["header-overflow-ellipsis"]: column.overflow === "ellipsis",
                  ["header-overflow-truncate"]: column.overflow === "truncate",
                })}
              >
                {column.render("Header")}
              </div>
              <div>
                <div
                  className="header-label-sorter"
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
              <div className="header-filter">{column.render("Filter")}</div>
            )}
            {column.canResize && (
              <div
                {...(column.getResizerProps?.() || {})}
                className="col-resizer"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabularHeader;
