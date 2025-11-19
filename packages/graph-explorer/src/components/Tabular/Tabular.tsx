import { cn, getChildOfType } from "@/utils";
import {
  type PropsWithChildren,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { TableInstance } from "react-table";
import useDeepCompareEffect from "use-deep-compare-effect";

import { useWithTheme } from "@/core";
import { useDeepMemo } from "@/hooks";

import {
  PaginationControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  TabularHeaderControls,
} from "./controls";
import type { TabularInstance } from "./helpers/tableInstanceToTabularInstance";
import tableInstanceToTabularInstance from "./helpers/tableInstanceToTabularInstance";
import defaultStyles from "./Tabular.styles";
import TabularControlsProvider, {
  useTabularControl,
} from "./TabularControlsProvider";
import TabularHeader from "./TabularHeader";
import TabularRow from "./TabularRow";
import type { TabularOptions } from "./useTabular";
import useTabular from "./useTabular";

export type TabularVariantType = "bordered" | "noBorders";

export interface TabularProps<T extends object> extends TabularOptions<T> {
  className?: string;

  /**
   * Disables the sticky header. By default, it is pinned to the top of the view
   * so that it is visible even when scrolling.
   */
  disableStickyHeader?: boolean;

  /**
   * Allows row to grow vertically. Each row grows to fit to table available space.
   */
  fitRowsVertically?: boolean;

  variant?: TabularVariantType;
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
  variant = "bordered",
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
    variant,
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
      <TabularContent
        {...tabularContentProps}
        variant={variant}
        tableInstance={tableInstance}
      />
    </TabularControlsProvider>
  );
};

const TabularContent = <T extends object>({
  children,
  className,
  tableInstance,
  disablePagination,
  disableStickyHeader,
  fitRowsVertically,
  rowSelectionMode,
  onRowMouseOver,
  onRowMouseOut,
  variant,
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
  const styleWithTheme = useWithTheme();

  const { getTableProps, getTableBodyProps, headerGroups, rows, page } =
    tableInstance;

  const actualRows = useDeepMemo(() => {
    if (disablePagination) {
      return rows;
    }

    return page;
  }, [disablePagination, rows, page]);

  const headerControlsChildren = getChildOfType(
    children,
    TabularHeaderControls.displayName || TabularHeaderControls.name,
  );

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
  }, [headerControlsRef, headerControlsChildren, headerControlsPosition]);

  return (
    <div
      ref={tableRef}
      className={cn(
        styleWithTheme(defaultStyles(variant)),
        className,
        "overflow-hidden",
      )}
      style={{
        userSelect: tableInstance.state.columnResizing?.isResizingColumn
          ? "none"
          : "auto",
      }}
    >
      {headerControlsChildren}
      <div {...getTableProps()} className="table overflow-auto">
        <div
          className={cn("headers", {
            ["headers-sticky"]: !disableStickyHeader,
          })}
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
        </div>
        <div {...getTableBodyProps()} className="body">
          {emptyBodyControlsChildren}
          {actualRows.map(row => {
            return (
              <TabularRow
                key={row.id}
                row={row}
                tableInstance={tableInstance}
                fitRowsVertically={fitRowsVertically}
                rowSelectionMode={rowSelectionMode}
                onMouseOver={onRowMouseOver}
                onMouseOut={onRowMouseOut}
              />
            );
          })}
        </div>
      </div>
      {footerControlsChildren}
      {!footerControlsChildren && !disablePagination && (
        <TabularFooterControls variant={variant}>
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
