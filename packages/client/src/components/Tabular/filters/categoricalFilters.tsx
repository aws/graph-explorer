import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import type { IdType, Row } from "react-table";

import SingleSelectFilter from "./SingleSelectFilter";

export const singleSelectionFilter = <T extends object = object>(
  activeTheme?: ActiveThemeType<ProcessedTheme>
) => () => ({
  filter: (rows: Row<T>[], id: IdType<T>[], filterValue: unknown) => {
    return rows.filter(row => row.values[id[0]] === filterValue);
  },
  filterComponent: SingleSelectFilter<T>(activeTheme),
});
