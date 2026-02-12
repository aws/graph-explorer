import { unparse } from "papaparse";

import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

import { LABELS } from "@/utils/constants";

export function transformToCsv<T extends object>(
  data: readonly T[],
  columns: TabularColumnInstance<T>[],
) {
  const csvRows = data.map(row =>
    columns.map(col => {
      const accessor = col.definition?.accessor;
      if (!accessor) {
        return null;
      }

      let value: unknown;

      if (typeof accessor === "function") {
        value = (accessor as (row: T) => unknown)(row);
      } else if (typeof accessor === "string") {
        value = (row as Record<string, unknown>)[accessor];
      } else {
        return null;
      }

      if (
        value === LABELS.MISSING_TYPE ||
        value === LABELS.MISSING_VALUE ||
        value === LABELS.EMPTY_VALUE
      ) {
        return null;
      }

      return value ?? null;
    }),
  );

  const headers = columns.map(col => col.definition?.label || col.instance.id);

  return unparse([headers, ...csvRows], { header: false });
}
