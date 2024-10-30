import { unparse } from "papaparse";
import type { Row } from "react-table";
import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";
import getNestedObjectValue from "./getNestedObjectValue";

export default function transformToCsv<T extends object>(
  currentDataSource: readonly T[] | Row<T>[],
  selectedColumns: Record<string, boolean>,
  columns: TabularColumnInstance<T>[]
) {
  const filteredRows = currentDataSource
    .map(row => (row as Row<T>).original || row)
    .map(row => {
      return Object.entries(selectedColumns).reduce(
        (cells, [columnId, shouldExport]) => {
          if (shouldExport) {
            const colDef = columns.find(
              colDef => colDef.instance.id === columnId
            )?.definition;

            if (typeof colDef?.accessor === "string") {
              cells.push(getNestedObjectValue(row, columnId.split(".")));
            } else {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              cells.push(colDef?.accessor?.(row));
            }
          }

          return cells;
        },
        [] as (string | number)[]
      );
    }, []);

  const headers = Object.entries(selectedColumns).reduce<string[]>(
    (header, [columnId, shouldExport]) => {
      if (!shouldExport) {
        return header;
      }

      const label =
        columns.find(colDef => colDef.instance.id === columnId)?.definition
          ?.label || columnId;

      header.push(label);
      return header;
    },
    []
  );

  return unparse([headers, ...filteredRows], { header: false });
}
