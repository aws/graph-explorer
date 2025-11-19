import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

export function transformToJson<T extends object>(
  data: readonly T[],
  columns: TabularColumnInstance<T>[],
) {
  return data.map(row =>
    columns
      .map(col => {
        const accessor = col.definition?.accessor;
        if (accessor == null || typeof accessor !== "string") {
          return null;
        }
        const value = (row as any)[accessor] as string | number;
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
