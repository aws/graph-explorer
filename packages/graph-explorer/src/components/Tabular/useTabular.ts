import {
  MouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActionType,
  CellProps,
  Column,
  ColumnInstance,
  ColumnInterfaceBasedOnValue,
  DefaultFilterTypes,
  IdType,
  Row,
  TableInstance,
  TableOptions,
  TableState,
  useBlockLayout,
  useColumnOrder,
  UseColumnOrderState,
  useFilters,
  UseFiltersColumnOptions,
  useFlexLayout,
  useGlobalFilter,
  usePagination,
  useResizeColumns,
  useRowSelect,
  UseRowSelectInstanceProps,
  UseRowSelectState,
  useSortBy,
  UseSortByColumnOptions,
  useTable,
} from "react-table";
import { useTheme } from "../../core";
import { useDeepMemo } from "../../hooks";
import TextFilter from "./filters/TextFilter";
import columnDefinitionToColumn from "./helpers/columnDefinitionToColumn";
import useSelectionColumn from "./hooks/useSelectionColumn";
import useDiffState from "./plugins/useDiffState";
import useFullWidth from "./plugins/useFullWidth";

export type CellComponentProps<T extends object> = CellProps<T>;
export type OnDataFilteredChange<T extends object> = (
  filteredRows: Row<T>[],
  areFiltersApplied: boolean
) => void;

export type TabularFilterType =
  | {
      name: "number";
      options?: {
        operator: "<" | "<=" | "=" | ">=" | ">";
      };
    }
  | {
      name: "string";
      options?: {
        operator: DefaultFilterTypes;
      };
    }
  | {
      name: "single-select";
    };

export type ColumnDefinition<T extends object> = Pick<
  Column<T>,
  "accessor" | "id" | "width" | "minWidth" | "maxWidth"
> & {
  columns?: Array<ColumnDefinition<T>>;

  /**
   * Label for the column.
   */
  label?: string;

  /**
   * headerComponent has higher priority than label but both allow to define the column header appearance.
   */
  headerComponent?: Column<T>["Header"];

  /**
   * Function (or component) used for formatting the column value
   */
  cellComponent?: ColumnInterfaceBasedOnValue<T>["Cell"];

  /**
   * Allows to choose predefined filter types.
   * E.g. string, number, single selection, date, ...
   */
  filterType?: TabularFilterType;

  /**
   * By default, it uses a text match filter
   */
  filter?: UseFiltersColumnOptions<T>["filter"];

  /**
   * By default, it uses a Text Input filter component
   * @param props - Receives the table instance and column as props
   */
  filterComponent?: (
    props: TableInstance<T> & { column: ColumnInstance<T> }
  ) => ReactNode;

  /**
   * Allows to enable the filtering for a column. Defaults to true.
   */
  filterable?: boolean;

  /**
   * String options: string, number, basic, datetime, alphanumeric. Defaults to alphanumeric.
   */
  sorter?: UseSortByColumnOptions<T>["sortType"];

  /**
   * Allows to enable the sorting for a column. Defaults to true.
   */
  sortable?: boolean;
  sortDescFirst?: boolean;
  sortInverted?: boolean;

  /**
   * Allows to enable the resizing for a column. Defaults to true.
   */
  resizable?: boolean;

  /**
   * Allows to align the column header as well the cell to the
   * left or right side of the column. Defaults to left.
   */
  align?: "left" | "right";

  /**
   * Define the column initially hidden
   */
  hidden?: boolean;

  /**
   * Disable the possibility to hide the column
   */
  unhideable?: boolean;

  /**
   * Allows to cut the text of cells using ellipsis or truncate strategy.
   */
  overflow?: "ellipsis" | "truncate" | "none";

  /**
   * Prevents word wraps for large text content.
   */
  oneLine?: boolean;
};

export interface TabularOptions<T extends object> {
  /**
   * Must be memoized.
   */
  data: TableOptions<T>["data"];

  /**
   * Must be memoized.
   */
  columns: Array<ColumnDefinition<T>>;

  /**
   * Default column values (width, filter, sorter, ...).
   */
  defaultColumn?: Partial<ColumnDefinition<T>>;

  /**
   * Change the base layout to a flex mode to fit the table to 100% width.
   * The resizing event does not fit the column to the exact position but
   * it books space in the entire table to the desired size.
   */
  fullWidth?: boolean;

  /**
   * Disables resizing for every column in the table.
   */
  disableResizing?: boolean;

  /**
   * Must be memoized. An array of sorting objects.
   */
  initialSorting?: Array<{ id: IdType<T>; desc?: boolean }>;

  /**
   * Disables sorting for every column in the table.
   */
  disableSorting?: boolean;

  /**
   * Disables multi-sorting for the entire table.
   * Multi-sort applies when shift key is pressed.
   */
  disableMultiSorting?: boolean;

  /**
   * If true, the un-sorted state will not be available to columns once they have been sorted.
   */
  disableSortRemove?: boolean;

  /**
   * Must be memoized. An array of filters.
   */
  initialFilters?: Array<{ id: IdType<T>; value: unknown }>;

  /**
   * Disables filtering for every column in the table.
   */
  disableFilters?: boolean;

  /**
   * Listen for filters changes.
   */
  onDataFilteredChange?: OnDataFilteredChange<T>;

  /**
   * The filters state will automatically reset if data is changed.
   */
  autoResetFilters?: boolean;

  /**
   * Disables the pagination.
   */
  disablePagination?: boolean;

  /**
   * Defines page sizes options.
   */
  paginationOptions?: number[];

  /**
   * Defines the initial page size. By default, it uses the first option defined in paginationOptions.
   */
  pageSize?: number;

  /**
   * Defines the initial page index.
   */
  pageIndex?: number;

  /**
   * Disables rows selection.
   */
  disableRowSelection?: boolean;

  /**
   * Defines the row selection behavior:
   * "Checkbox" adds a column to the table at the most left position.
   * "row" allows to Select the row by clicking on the row itself.
   * If it is not defined, rows are selectable but their management should be implemented
   * using controls or custom columns definitions
   */
  rowSelectionMode?: "checkbox" | "row";

  /**
   * Record with initial selected rows ids.
   * Changes in this record will not trigger any table update. For externally management of
   * rows selection, you should use 'selectedRowIds', 'toggleRowSelected', and 'toggleAllRowsSelected'.
   */
  initialSelectedRowIds?: UseRowSelectState<T>["selectedRowIds"];

  /**
   * Must be memoized. Record with selected or unselected rows ids.
   */
  selectedRowIds?: UseRowSelectState<T>["selectedRowIds"];

  /**
   * Handler to update selectedRowIds.
   */
  toggleRowSelected?: UseRowSelectInstanceProps<T>["toggleRowSelected"];

  /**
   * Handler to selected or deselect all rows ids.
   */
  toggleAllRowsSelected?: (
    value: boolean,
    affectedRowsIds: IdType<T>[]
  ) => void;

  onRowMouseOut?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;

  onRowMouseOver?(event: MouseEvent<HTMLDivElement>, row: Row<T>): void;

  /**
   * Must be memoized. An array with ordered columns.
   */
  initialColumnOrder?: UseColumnOrderState<T>["columnOrder"];

  /**
   * Must be memoized. An array with ordered columns.
   */
  initialHiddenColumns?: TableState<T>["hiddenColumns"];
}

export const useTabular = <T extends object>(options: TabularOptions<T>) => {
  const [activeTheme] = useTheme();

  const {
    data,
    columns,
    initialSorting,
    disableSorting,
    disableMultiSorting,
    initialFilters,
    fullWidth,
    initialSelectedRowIds,
    selectedRowIds,
    toggleRowSelected,
    toggleAllRowsSelected,
    initialColumnOrder,
    initialHiddenColumns,
    ...restOptions
  } = options;

  // Default defaultColumn if it's not defined in options
  const defaultColumn = useMemo(
    () => ({
      minWidth: 60,
      width: 100,
      Filter: TextFilter(activeTheme)({}),
      ...columnDefinitionToColumn(options.defaultColumn || {}),
    }),
    [activeTheme, options.defaultColumn]
  );

  const skipPageResetRef = useRef(false);
  const [updatedData, setUpdatedData] = useState(data);

  // Avoid table to delete filter on re-render
  useEffect(() => {
    skipPageResetRef.current = true;
    setUpdatedData(data);
  }, [data]);

  // Restore table filtering after updating data
  useEffect(() => {
    skipPageResetRef.current = false;
  }, [updatedData]);

  // Used to propagate managed states:
  // - selectedRowIds
  const stateReducer = (
    newState: TableState<T>,
    action: ActionType,
    previousState: TableState<T>,
    instance?: TableInstance<T>
  ) => {
    // Table is considered managed externally if 'selectedRowIds' is defined.
    // Otherwise, it manages its own internal state.
    if (action.type === "toggleRowSelected" && selectedRowIds) {
      toggleRowSelected?.(action.id, action.value);
      return previousState;
    }

    if (action.type === "toggleAllRowsSelected" && selectedRowIds) {
      toggleAllRowsSelected?.(
        action.value,
        instance?.rows.map(row => row.id) || []
      );
      return previousState;
    }

    return newState;
  };

  // Allows to manage external updates:
  // - selectedRowIds
  const useControlledState = (tableState: TableState<T>) => {
    return useMemo(
      () => ({
        ...tableState,
        selectedRowIds: !selectedRowIds
          ? tableState.selectedRowIds
          : Object.keys(selectedRowIds || {}).reduce((ids, rowId) => {
              // this reducer fixes getToggleAllRowsSelectedProps bad behaviour.
              // When the object contains { [rowId]: false } it marks the Checkbox as indeterminate
              if (selectedRowIds?.[rowId]) {
                ids[rowId as IdType<T>] = true;
              }

              return ids;
            }, {} as UseRowSelectState<T>["selectedRowIds"]),
      }),
      // selectedRowIds is necessary in deps to listen external updates
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tableState, selectedRowIds]
    );
  };

  return useTable(
    {
      ...restOptions,
      data: updatedData,
      defaultColumn,
      disableSortBy: disableSorting,
      disableMultiSort: disableMultiSorting,
      columns: useDeepMemo(
        () =>
          columns.map(column => columnDefinitionToColumn(column, activeTheme)),
        [columns, activeTheme]
      ),
      initialState: {
        sortBy: initialSorting || [],
        filters: initialFilters || [],
        pageIndex: options.pageIndex,
        pageSize: options.pageSize || options.paginationOptions?.[0],
        columnOrder: initialColumnOrder || [],
        hiddenColumns:
          initialHiddenColumns ||
          columns.reduce<string[]>((hiddenCols, col) => {
            if (col.hidden) {
              // If the column does not have id its accessor should be a valid string
              // However, both are optional in the main interface
              hiddenCols.push(
                col.id?.toString() || col.accessor?.toString() || ""
              );
            }

            return hiddenCols;
          }, []),
        selectedRowIds:
          initialSelectedRowIds ||
          ({} as UseRowSelectState<T>["selectedRowIds"]),
      },
      stateReducer,
      useControlledState,
      autoResetPage: !skipPageResetRef.current,
      autoResetExpanded: !skipPageResetRef.current,
      autoResetGroupBy: !skipPageResetRef.current,
      autoResetSelectedRows: !skipPageResetRef.current,
      autoResetSortBy: !skipPageResetRef.current,
      autoResetFilters: !skipPageResetRef.current,
      autoResetRowState: !skipPageResetRef.current,
    },
    useColumnOrder,
    useResizeColumns,
    fullWidth ? useFlexLayout : useBlockLayout,
    useFullWidth,
    useFilters,
    useGlobalFilter,
    useDiffState,
    useSortBy,
    usePagination,
    useRowSelect,
    useSelectionColumn(options)
  );
};

export default useTabular;
