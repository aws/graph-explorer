import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import isEqual from "date-fns/isEqual";
import startOfDay from "date-fns/startOfDay";
import type { IdType, Row } from "react-table";

import type { DatePickerProps } from "../../DatePicker";
import { DateFilter } from "./DateFilter";

export const dateFilter = <T extends object>(
  activeTheme?: ActiveThemeType<ProcessedTheme>
) => (mode?: DatePickerProps["mode"]) => {
  if (mode === "calendar") {
    return {
      filter: (
        rows: Row<T>[],
        columnsIds: IdType<T>[],
        // Expect an ISO date string
        filterValue: string | undefined
      ) => {
        if (filterValue === undefined) {
          return rows;
        }

        return rows.filter(row => {
          const date = row.values[columnsIds[0]];
          if (!date) {
            return false;
          }

          return isEqual(
            // Expect date string such YYYY-MM-DD hh:mm:ss
            startOfDay(
              new Date((date.replace(" ", "T") + "Z").replace("ZZ", "Z"))
            ),
            startOfDay(new Date(filterValue))
          );
        });
      },
      filterComponent: DateFilter(activeTheme)(mode),
    };
  }

  return {
    filter: (
      rows: Row<T>[],
      columnsIds: IdType<T>[],
      // Expect an ISO date string
      filterValue: { startDate: string; endDate: string } | undefined
    ) => {
      if (filterValue === undefined) {
        return rows;
      }

      return rows.filter(row => {
        const date = row.values[columnsIds[0]];
        if (!date || !filterValue) {
          return false;
        }

        return (
          isAfter(
            new Date((date.replace(" ", "T") + "Z").replace("ZZ", "Z")),
            new Date(filterValue.startDate)
          ) &&
          isBefore(
            new Date((date.replace(" ", "T") + "Z").replace("ZZ", "Z")),
            new Date(filterValue.endDate)
          )
        );
      });
    },
    filterComponent: DateFilter(activeTheme)(mode),
  };
};
