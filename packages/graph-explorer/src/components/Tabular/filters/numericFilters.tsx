import { ReactNode } from "react";
import type { IdType, Row } from "react-table";

import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import {
  EqualsIcon,
  GreaterOrEqualThanIcon,
  GreaterThanIcon,
  LessOrEqualThanIcon,
  LessThanIcon,
} from "../../icons";
import TextFilter from "./TextFilter";
import type { TextFilterProps } from "./TextFilter";

type FilterFn<T extends object = object> = (
  rows: Row<T>[],
  id: IdType<T>[],
  filterValue: unknown
) => Row<T>[];

const numberComparisonFilter = <T extends object>(
  compare: (rValue: number, fValue: number) => boolean
) => (rows: Row<T>[], columnsIds: IdType<T>[], filterValue: unknown) => {
  const filter = Number(filterValue);
  if (isNaN(filter)) {
    return rows;
  }

  return rows.filter(row => {
    return compare(Number(row.values[columnsIds[0]]), filter);
  });
};

const equalsFilter = <T extends object>() =>
  numberComparisonFilter<T>(
    (rowValue, filterValue) => rowValue === filterValue
  );

const lessThanFilter = <T extends object>() =>
  numberComparisonFilter<T>((rowValue, filterValue) => rowValue < filterValue);

const lessOrEqualThanFilter = <T extends object>() =>
  numberComparisonFilter<T>((rowValue, filterValue) => rowValue <= filterValue);

const greaterThanFilter = <T extends object>() =>
  numberComparisonFilter<T>((rowValue, filterValue) => rowValue > filterValue);

const greaterOrEqualThanFilter = <T extends object>() =>
  numberComparisonFilter<T>((rowValue, filterValue) => rowValue >= filterValue);

const filtersMap: Record<string, <T extends object>() => FilterFn<T>> = {
  "=": equalsFilter,
  ">": greaterThanFilter,
  ">=": greaterOrEqualThanFilter,
  "<": lessThanFilter,
  "<=": lessOrEqualThanFilter,
};

const placeholdersMap: Record<string, string> = {
  "=": "Equals to...",
  ">": "Greater than...",
  ">=": "Greater or equal than...",
  "<": "Less than...",
  "<=": "Less or equal than...",
};

const filtersComponentMap: Record<string, ReactNode> = {
  "=": <EqualsIcon />,
  ">": <GreaterThanIcon />,
  ">=": <GreaterOrEqualThanIcon />,
  "<": <LessThanIcon />,
  "<=": <LessOrEqualThanIcon />,
};

export const numericFilter = <T extends object>(
  activeTheme?: ActiveThemeType<ProcessedTheme>
) => (operator: string, props: TextFilterProps = {}) => ({
  filter: filtersMap[operator]<T>(),
  filterComponent: TextFilter<T>(activeTheme)({
    placeholder: props.placeholder || placeholdersMap[operator],
    startAdornment: props.startAdornment || filtersComponentMap[operator],
  }),
});
