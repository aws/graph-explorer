import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

import { LABELS } from "@/utils/constants";

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
        let value: string | number | null;

        if (typeof accessor === "function") {
          value = (accessor as (row: T) => unknown)(row) as
            | string
            | number
            | null;
        } else {
          value = (row as Record<string, unknown>)[accessor as string] as
            | string
            | number
            | null;
        }

        if (
          value === LABELS.MISSING_TYPE ||
          value === LABELS.MISSING_VALUE ||
          value === LABELS.EMPTY_VALUE
        ) {
          return null;
        }

        const label = col.definition?.label || col.instance.id;
        return [label, value] as const;
      })
      .filter(
        (item): item is readonly [string, string | number | null] =>
          item !== null,
      )
      .reduce(
        (acc, [label, value]) => {
          acc[label] = value;
          return acc;
        },
        {} as Record<string, string | number | null>,
      ),
  );
}
