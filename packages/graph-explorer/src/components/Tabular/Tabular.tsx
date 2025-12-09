import { cn, getChildOfType } from "@/utils";
import {
  type PropsWithChildren,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { TableInstance } from "react-table";
import useDeepCompareEffect from "use-deep-compare-effect";

import { useDeepMemo } from "@/hooks";

import {
  PaginationControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
} from "./controls";
import type { TabularInstance } from "./helpers/tableInstanceToTabularInstance";
import tableInstanceToTabularInstance from "./helpers/tableInstanceToTabularInstance";
import TabularControlsProvider, {
  useTabularControl,
} from "./TabularControlsProvider";
import TabularHeader from "./TabularHeader";
import TabularRow from "./TabularRow";
import type { TabularOptions } from "./useTabular";
import useTabular from "./useTabular";

export interface TabularProps<T extends object> extends TabularOptions<T> {
  className?: string;
  globalSearch?: string;
  ref?: React.Ref<TabularInstance<T>>;
}

export const Tabular = <T extends object>({
  children,
  className,
  data,
  disablePagination,
  paginationOptions = [10, 20, 50],
  pageIndex = 0,
  pageSize = 10,
  onDataFilteredChange,
  onColumnSortedChange,
  globalSearch,
  ref,
  ...useTabularOptions
}: PropsWithChildren<TabularProps<T>>) => {
  const tableInstance = useTabular({
    ...useTabularOptions,
    data,
    paginationOptions,
    pageIndex,
    pageSize,
  });

  const tabularContentProps = {
    children,
    className,
    data,
    disablePagination,
    paginationOptions,
    pageIndex,
    pageSize,
    ...useTabularOptions,
  };

  useEffect(() => {
    tableInstance.setGlobalFilter(globalSearch);
  }, [globalSearch, tableInstance]);

  const tabularInstance = tableInstanceToTabularInstance(
    tableInstance,
    tabularContentProps,
  );

  // This hook is only triggered when filter change
  useDeepCompareEffect(() => {
    if (tableInstance.state.diff.filters) {
      onDataFilteredChange?.(
        tableInstance.filteredRows,
        tableInstance.state.filters,
      );
    }
  }, [
    onDataFilteredChange,
    tableInstance.state.filters,
    tableInstance.filteredRows,
  ]);

  useDeepCompareEffect(() => {
    onColumnSortedChange?.(tableInstance.state.sortBy);
  }, [onColumnSortedChange, tableInstance.state.sortBy]);

  useImperativeHandle(ref, () => tabularInstance, [tabularInstance]);

  return (
    <TabularControlsProvider tabularInstance={tabularInstance}>
      <TabularContent {...tabularContentProps} tableInstance={tableInstance} />
    </TabularControlsProvider>
  );
};

const TabularContent = <T extends object>({
  children,
  className,
  tableInstance,
  disablePagination,
  rowSelectionMode,
  onRowMouseOver,
  onRowMouseOut,
}: PropsWithChildren<
  TabularProps<T> & { tableInstance: TableInstance<T> }
>) => {
  /*
   * DEV NOTE: This react table is refusing to refusing to re-render when the
   * column width is being resized by the user. Disabling React Compiler here
   * fixes the issue. We can likely revisit this when we upgrade to the newest
   * React Table version.
   */
  "use no memo";

  const { tableRef, headerControlsRef, headerControlsPosition } =
    useTabularControl();
  const [stickyHeaderTop, setStickyHeaderTop] = useState(0);

  const { getTableProps, getTableBodyProps, headerGroups, rows, page } =
    tableInstance;

  const actualRows = useDeepMemo(() => {
    if (disablePagination) {
      return rows;
    }

    return page;
  }, [disablePagination, rows, page]);

  const footerControlsChildren = getChildOfType(
    children,
    TabularFooterControls.displayName || TabularFooterControls.name,
  );

  const emptyBodyControlsChildren = getChildOfType(
    children,
    TabularEmptyBodyControls.displayName || TabularEmptyBodyControls.name,
  );

  useEffect(() => {
    if (!headerControlsRef.current || headerControlsPosition !== "sticky") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStickyHeaderTop(0);
      return;
    }

    const { height } = headerControlsRef.current.getBoundingClientRect();
    setStickyHeaderTop(height);
    // headerControlsChildren can affect to the container's height
  }, [headerControlsRef, headerControlsPosition]);

  return (
    <div
      ref={tableRef}
      className={cn(
        "bg-background-default text-text-primary flex h-full max-h-full w-full max-w-full flex-col overflow-hidden",
        className,
      )}
      style={{
        userSelect: tableInstance.state.columnResizing?.isResizingColumn
          ? "none"
          : "auto",
      }}
    >
      <table
        {...getTableProps()}
        className="relative isolate flex w-full grow flex-col overflow-auto"
      >
        <thead
          className="sticky top-0 z-1 w-fit min-w-full"
          style={{
            // Top is assigned depending on the header-controls visibility and height
            // It only affects to sticky header
            top: stickyHeaderTop,
          }}
        >
          {headerGroups.map(headerGroup => (
            <TabularHeader
              key={headerGroup.getHeaderGroupProps().key}
              headerGroup={headerGroup}
              tableInstance={tableInstance}
            />
          ))}
        </thead>
        <tbody
          {...getTableBodyProps()}
          className={cn(
            "flex w-fit min-w-full flex-col",
            actualRows.length === 0 && "grow",
          )}
        >
          {!actualRows.length && (
            <tr className="grow">
              <td
                colSpan={tableInstance.columns.length}
                className="grid size-full grow"
              >
                {emptyBodyControlsChildren}
              </td>
            </tr>
          )}
          {actualRows.map(row => {
            return (
              <TabularRow
                key={row.id}
                row={row}
                tableInstance={tableInstance}
                rowSelectionMode={rowSelectionMode}
                onMouseOver={onRowMouseOver}
                onMouseOut={onRowMouseOut}
              />
            );
          })}
        </tbody>
      </table>
      {footerControlsChildren}
      {!footerControlsChildren && !disablePagination && (
        <TabularFooterControls>
          <Paging totalRows={rows.length} />
        </TabularFooterControls>
      )}
    </div>
  );
};

function Paging({ totalRows }: { totalRows: number }) {
  const {
    instance: { disablePagination, gotoPage, setPageSize, pageIndex, pageSize },
  } = useTabularControl();

  if (disablePagination) {
    return null;
  }

  return (
    <PaginationControl
      pageIndex={pageIndex}
      onPageIndexChange={index => gotoPage(index)}
      pageSize={pageSize}
      onPageSizeChange={size => setPageSize(size)}
      totalRows={totalRows}
    />
  );
}

export default Tabular;
