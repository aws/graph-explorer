import { unparse } from "papaparse";

import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

export function transformToCsv<T extends object>(
  data: readonly T[],
  columns: TabularColumnInstance<T>[],
) {
  const csvRows = data.map(row =>
    columns.map(col => {
      const accessor = col.definition?.accessor;
      if (accessor == null) {
        return null;
      }
      if (typeof accessor === "function") {
        return (accessor as (row: T) => unknown)(row);
      }
      if (typeof accessor === "string") {
        return (row as Record<string, unknown>)[accessor];
      }
      return null;
    }),
  );
  const headers = columns.map(col => col.definition?.label || col.instance.id);

  return unparse([headers, ...csvRows], { header: false });
}
