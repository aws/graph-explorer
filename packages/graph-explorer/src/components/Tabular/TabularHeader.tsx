import { cn } from "@/utils";
import { ArrowDown } from "lucide-react";
import type { HeaderGroup, TableInstance } from "react-table";

const TabularHeader = <T extends object>({
  headerGroup,
  tableInstance,
}: {
  tableInstance: TableInstance<T>;
  headerGroup: HeaderGroup<T>;
}) => {
  const { state } = tableInstance;
  const { key, ...otherProps } = headerGroup.getHeaderGroupProps();

  const isResizing = (columnId: string) =>
    state.columnResizing?.isResizingColumn === columnId;

  return (
    <tr
      key={key}
      {...otherProps}
      className="grow-0 border border-x-transparent border-t-transparent bg-gray-50"
    >
      {headerGroup.headers.map(column => {
        const { key, ...headerProps } = column.getHeaderProps(
          column.getSortByToggleProps(),
        );

        // This wrapper avoids collisions between sort and resize events
        return (
          <th
            key={key}
            {...headerProps}
            className={cn(
              "group/th text-secondary grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-1 border-r px-2 py-1 font-medium transition-[background,border] duration-150 last:border-none",
              (column.isResizing || isResizing(column.id)) &&
                "border-primary-dark cursor-col-resize! border-dashed",
              column.canSort && "cursor-pointer",
            )}
          >
            <div
              className="place-self-start overflow-hidden text-left data-[align='right']:text-right data-[overflow='ellipsis']:text-ellipsis"
              data-align={column.align}
              data-overflow={column.overflow}
            >
              {column.render("Header")}
            </div>

            <div
              className={cn(
                "invisible place-self-start opacity-50 transition-transform duration-150 data-sortable:group-hover/th:visible data-[direction='asc']:rotate-180 data-[state='sorted']:visible data-[state='sorted']:opacity-100",
              )}
              data-state={column.isSorted ? "sorted" : "none"}
              data-direction={column.isSortedDesc ? "desc" : "asc"}
              data-sortable={column.canSort ? "true" : undefined}
            >
              <ArrowDown className="size-5" />
            </div>

            {column.canFilter && (
              <div className="col-span-2 self-end">
                {column.render("Filter")}
              </div>
            )}
            {column.canResize && (
              <div
                {...(column.getResizerProps?.() || {})}
                className="absolute top-0 right-0 z-1 h-full w-2"
              />
            )}
          </th>
        );
      })}
    </tr>
  );
};

export default TabularHeader;
