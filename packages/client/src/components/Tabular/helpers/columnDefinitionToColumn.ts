import { Column, ColumnGroup, ColumnInterfaceBasedOnValue } from "react-table";
import type { ActiveThemeType, ProcessedTheme } from "../../../core";

import { numericFilter, singleSelectionFilter } from "../filters";
import type { ColumnDefinition } from "../useTabular";

const resolverFilterType = <T extends object>(
  column: ColumnDefinition<T>,
  activeTheme?: ActiveThemeType<ProcessedTheme>
): ColumnDefinition<T> => {
  const { filterType, ...restColumnsProps } = column;

  if (!filterType) {
    return restColumnsProps;
  }

  if (filterType.name === "string") {
    return {
      ...restColumnsProps,
      filter: filterType.options?.operator || "text",
    };
  }

  if (filterType.name === "number") {
    return {
      ...restColumnsProps,
      ...numericFilter<T>(activeTheme)(filterType.options?.operator || "="),
    };
  }

  if (filterType.name === "single-select") {
    return {
      ...restColumnsProps,
      ...singleSelectionFilter<T>(activeTheme)(),
    };
  }

  // This fallback assumes that the column is string.
  return {
    ...restColumnsProps,
    filter: "text",
  };
};

/**
 * In order to have a comfortable interface that does not depends on
 * the react-table and its plugins interfaces, this method maps
 * every property that has been redefined to its corresponding name.
 */
const columnDefinitionToColumn = <T extends object>(
  columnDefinition: ColumnDefinition<T>,
  activeTheme?: ActiveThemeType<ProcessedTheme>
): Column<T> => {
  const mergedColumnDefinition = {
    ...columnDefinition,
    ...resolverFilterType(columnDefinition, activeTheme),
  };

  const {
    label,
    headerComponent,
    cellComponent,
    filterComponent,
    filterable,
    sorter,
    sortable,
    resizable,
    columns,
    ...commonProps
  } = mergedColumnDefinition;

  // Accessor is a complex type that changes depends on
  // several variables. For example, groups do not require accessor.
  const column: Column<T> & ColumnInterfaceBasedOnValue<T> = {
    Header: headerComponent || label || "",
    sortType: sorter || "alphanumeric",
    disableFilters: filterable === false,
    disableSortBy: sortable === false,
    disableResizing: resizable === false,
    ...commonProps,
  } as Column<T> & ColumnInterfaceBasedOnValue<T>;

  // Do not send undefined for Cell
  if (cellComponent) {
    column.Cell = cellComponent;
  }

  // Do not send undefined for Filter
  if (filterComponent) {
    column.Filter = filterComponent;
  }

  if (columns) {
    (column as ColumnGroup<T>).columns = columns.map(column =>
      columnDefinitionToColumn(column, activeTheme)
    );
  }

  return column;
};

export default columnDefinitionToColumn;
