import { cx } from "@emotion/css";
import {
  ForwardedRef,
  forwardRef,
  PropsWithChildren,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { TableInstance } from "react-table";
import useDeepCompareEffect from "use-deep-compare-effect";

import { useWithTheme, withClassNamePrefix } from "../../core";
import { useDeepMemo } from "../../hooks";
import { getChildOfType } from "../../utils";

import {
  PaginationControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  TabularHeaderControls,
} from "./controls";
import type { TabularInstance } from "./helpers/tableInstanceToTabularInstance";
import tableInstanceToTabularInstance from "./helpers/tableInstanceToTabularInstance";
import { TABULAR_SELECTION_COL_ID } from "./hooks/useSelectionColumn";
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
  classNamePrefix?: string;
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
}

export const Tabular = <T extends object>(
  {
    children,
    classNamePrefix = "ft",
    className,
    data,
    disablePagination,
    paginationOptions = [10, 20, 50],
    pageIndex = 0,
    pageSize = 10,
    onDataFilteredChange,
    variant = "bordered",
    globalSearch,
    ...useTabularOptions
  }: PropsWithChildren<TabularProps<T>>,
  ref: ForwardedRef<TabularInstance<T>>
) => {
  const tableInstance = useTabular({
    ...useTabularOptions,
    data,
    paginationOptions,
    pageIndex,
    pageSize,
  });

  const tabularContentProps = {
    children,
    classNamePrefix,
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
    tabularContentProps
  );

  // This hook is only triggered when filter change
  useDeepCompareEffect(() => {
    if (tableInstance.state.diff.filters) {
      onDataFilteredChange?.(
        tableInstance.filteredRows,
        tableInstance.state.filters.length !== 0
      );
    }
  }, [
    onDataFilteredChange,
    tableInstance.state.diff.filters,
    tableInstance.state.filters.length,
    tableInstance.filteredRows,
  ]);

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
  classNamePrefix = "ft",
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
  const pfx = withClassNamePrefix(classNamePrefix);
  const {
    tableRef,
    headerControlsRef,
    headerControlsPosition,
  } = useTabularControl();
  const [stickyHeaderTop, setStickyHeaderTop] = useState(0);
  const styleWithTheme = useWithTheme();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    page,
    setHiddenColumns,
  } = tableInstance;

  const actualRows = useDeepMemo(() => {
    if (disablePagination) {
      return rows;
    }

    return page;
  }, [disablePagination, rows, page]);

  const headerControlsChildren = useMemo(() => {
    return getChildOfType(
      children,
      TabularHeaderControls.displayName || TabularHeaderControls.name
    );
  }, [children]);

  const footerControlsChildren = useMemo(() => {
    return getChildOfType(
      children,
      TabularFooterControls.displayName || TabularFooterControls.name
    );
  }, [children]);

  const emptyBodyControlsChildren = useMemo(() => {
    return getChildOfType(
      children,
      TabularEmptyBodyControls.displayName || TabularEmptyBodyControls.name
    );
  }, [children]);

  useEffect(() => {
    if (!headerControlsRef.current || headerControlsPosition !== "sticky") {
      setStickyHeaderTop(0);
      return;
    }

    const { height } = headerControlsRef.current.getBoundingClientRect();
    setStickyHeaderTop(height);
    // headerControlsChildren can affect to the container's height
  }, [headerControlsRef, headerControlsChildren, headerControlsPosition]);

  useEffect(() => {
    if (rowSelectionMode !== "checkbox") {
      setHiddenColumns(hiddenColumns => [
        TABULAR_SELECTION_COL_ID,
        ...hiddenColumns,
      ]);

      return;
    }

    setHiddenColumns(hiddenColumns =>
      hiddenColumns.filter(col => col !== TABULAR_SELECTION_COL_ID)
    );
  }, [setHiddenColumns, rowSelectionMode]);

  return (
    <div
      ref={tableRef}
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix, variant)),
        className
      )}
      style={{
        userSelect: tableInstance.state.columnResizing?.isResizingColumn
          ? "none"
          : "auto",
      }}
    >
      {headerControlsChildren}
      <div {...getTableProps()} className={pfx("table")}>
        <div
          className={cx(pfx("headers"), {
            [pfx("headers-sticky")]: !disableStickyHeader,
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
        <div {...getTableBodyProps()} className={pfx("body")}>
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
          <PaginationControl
            classNamePrefix={classNamePrefix}
            totalRows={rows.length}
          />
        </TabularFooterControls>
      )}
    </div>
  );
};

export default forwardRef(Tabular) as <T extends object>(
  props: PropsWithChildren<TabularProps<T>> & {
    ref?: ForwardedRef<TabularInstance<T>>;
  }
) => ReturnType<typeof Tabular>;
