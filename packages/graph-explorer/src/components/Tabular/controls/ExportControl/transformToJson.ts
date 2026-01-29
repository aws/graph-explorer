import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

export function transformToJson<T extends object>(
  data: readonly T[],
  columns: TabularColumnInstance<T>[],
) {
  return data.map(row =>
    columns
      .map(col => {
        const accessor = col.definition?.accessor;
        if (accessor == null) {
          return null;
        }
        let value: string | number;
        if (typeof accessor === "function") {
          value = (accessor as (row: T) => unknown)(row) as string | number;
        } else if (typeof accessor === "string") {
          value = (row as Record<string, unknown>)[accessor] as string | number;
        } else {
          return null;
        }
        const label = col.definition?.label || col.instance.id;
        return [label, value] as const;
      })
      .filter(item => item != null)
      .reduce(
        (acc, [label, value]) => {
          acc[label] = value;
          return acc;
        },
        {} as Record<string, string | number>,
      ),
  );
}
