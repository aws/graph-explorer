import { unparse } from "papaparse";
import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

export function transformToCsv<T extends object>(
  data: readonly T[],
  columns: TabularColumnInstance<T>[]
) {
  const csvRows = data.map(row =>
    columns.map(col => {
      const accessor = col.definition?.accessor;
      if (accessor == null || typeof accessor !== "string") {
        return null;
      }
      return (row as any)[accessor];
    })
  );
  const headers = columns.map(col => col.definition?.label || col.instance.id);

  return unparse([headers, ...csvRows], { header: false });
}
