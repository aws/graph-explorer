/**
 * In order to avoid export react-table and their plugins properties,
 * this method transform the output properly.
 */
import {
  ColumnInstance,
  Filters,
  FilterValue,
  IdType,
  Row,
  TableInstance,
  UseColumnOrderInstanceProps,
  UseColumnOrderState,
  UseFiltersInstanceProps,
  UseRowSelectInstanceProps,
  UseRowSelectState,
  UseSortByInstanceProps,
  UseSortByState,
  UseTableInstanceProps,
} from "react-table";

import type { TabularProps } from "../Tabular";
import type { ColumnDefinition } from "../useTabular";

export type TabularColumnInstance<T extends object> = {
  instance: ColumnInstance<T>;
  definition?: ColumnDefinition<T>;
};

export type TabularInstance<T extends object> = {
  /**
   * Original data
   */
  data: readonly T[];

  /**
   * All rows in the table (all rows even if it is paginated)
   */
  rows: Row<T>[];

  /**
   * All columns definitions
   */
  columns: TabularColumnInstance<T>[];

  /**
   * All rows in the current table
   */
  page: Row<T>[];

  /**
   * Current columns filters values
   */
  filters?: Filters<T>;

  /**
   * Handler to set filter values by column id
   */
  setFilter: UseFiltersInstanceProps<T>["setFilter"];

  /**
   * Clear all filters
   */
  clearFilters(): void;

  /**
   * Global filter value
   */
  globalFilter: unknown;

  /**
   * Handler to set global filter value
   */
  setGlobalFilter: (filterValue: FilterValue) => void;

  /**
   * Current columns sort state
   */
  sorts: UseSortByState<T>["sortBy"];

  /**
   * Handler to set sort values by column
   */
  setSort: UseSortByInstanceProps<T>["setSortBy"];

  /**
   * Handler to toggle sort state by column
   */
  toggleSort: UseSortByInstanceProps<T>["toggleSortBy"];

  disablePagination?: boolean;
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageOptions: number[];
  pageCount: number;
  gotoPage(updater: ((pageIndex: number) => number) | number): void;
  previousPage(): void;
  nextPage(): void;
  setPageSize(pageSize: number): void;
  pageIndex: number;
  pageSize: number;

  selectedRowIds: UseRowSelectState<T>["selectedRowIds"];

  /**
   * Handler to toggle all selected rows
   */
  toggleAllRowsSelected: UseRowSelectInstanceProps<T>["toggleAllRowsSelected"];

  /**
   * Handler to toggle an individual row
   */
  toggleRowSelected: UseRowSelectInstanceProps<T>["toggleRowSelected"];

  columnOrder: UseColumnOrderState<T>["columnOrder"];

  /**
   * Handler to change the column order
   */
  setColumnOrder: UseColumnOrderInstanceProps<T>["setColumnOrder"];

  visibleColumns: Record<IdType<T>, boolean>;

  /**
   * Handler to toggle all columns visibility
   */
  toggleHideAllColumns: UseTableInstanceProps<T>["toggleHideAllColumns"];

  /**
   * Handler to toggle the column visibility
   */
  toggleHideColumn: UseTableInstanceProps<T>["toggleHideColumn"];

  /**
   * An array with ordered columns.
   */
  initialColumnOrder: UseColumnOrderState<T>["columnOrder"];

  /**
   * An array with ordered columns.
   */
  initialHiddenColumns: Array<IdType<T>>;
};

const tableInstanceToTabularInstance = <T extends object>(
  tableInstance: TableInstance<T>,
  tableProps: TabularProps<T>
): TabularInstance<T> => {
  return {
    data: tableProps.data,
    rows: tableInstance.rows,
    columns: tableInstance.columns.map(column => {
      const currentColDef = tableProps.columns.find(
        columnDef =>
          columnDef.id === column.id || columnDef.accessor === column.id
      );

      return {
        instance: column,
        definition: currentColDef,
      };
    }),
    // Filtering
    filters: tableInstance.state.filters,
    globalFilter: tableInstance.state.globalFilter,
    setFilter: tableInstance.setFilter,
    clearFilters: () => tableInstance.setAllFilters(() => []),
    setGlobalFilter: tableInstance.setGlobalFilter,
    // Sorting
    sorts: tableInstance.state.sortBy,
    setSort: tableInstance.setSortBy,
    toggleSort: tableInstance.toggleSortBy,
    // Pagination
    page: tableInstance.page,
    disablePagination: tableProps.disablePagination,
    canPreviousPage: tableInstance.canPreviousPage,
    canNextPage: tableInstance.canNextPage,
    pageOptions: tableProps.paginationOptions || [10, 20, 50],
    pageCount: tableInstance.pageCount,
    gotoPage: tableInstance.gotoPage,
    previousPage: tableInstance.previousPage,
    nextPage: tableInstance.nextPage,
    setPageSize: tableInstance.setPageSize,
    pageIndex: tableInstance.state.pageIndex,
    pageSize: tableInstance.state.pageSize,
    // Row selection
    selectedRowIds: tableInstance.state.selectedRowIds,
    toggleAllRowsSelected: tableInstance.toggleAllRowsSelected,
    toggleRowSelected: tableInstance.toggleRowSelected,
    // Columns order
    initialColumnOrder: [
      ...(tableProps.initialColumnOrder || []),
      ...tableInstance.columns.reduce((nonOrderedColumns, column) => {
        if (!tableProps.initialColumnOrder?.includes(column.id)) {
          nonOrderedColumns.push(column.id);
        }
        return nonOrderedColumns;
      }, [] as IdType<T>[]),
    ],
    columnOrder: [
      ...(tableInstance.state.columnOrder || []),
      ...tableInstance.columns.reduce((nonOrderedColumns, column) => {
        if (!tableInstance.state.columnOrder?.includes(column.id)) {
          nonOrderedColumns.push(column.id);
        }
        return nonOrderedColumns;
      }, [] as IdType<T>[]),
    ],
    setColumnOrder: tableInstance.setColumnOrder,
    // Columns visibility
    initialHiddenColumns:
      tableProps.initialHiddenColumns ||
      tableProps.columns.reduce<string[]>((hiddenCols, col) => {
        if (col.hidden) {
          hiddenCols.push(col.id?.toString() || col.accessor?.toString() || "");
        }

        return hiddenCols;
      }, []),
    visibleColumns: tableInstance.visibleColumns.reduce((visible, col) => {
      visible[col.id] = col.isVisible;

      return visible;
    }, {} as TabularInstance<T>["visibleColumns"]),
    toggleHideAllColumns: tableInstance.toggleHideAllColumns,
    toggleHideColumn: tableInstance.toggleHideColumn,
  };
};

export default tableInstanceToTabularInstance;
