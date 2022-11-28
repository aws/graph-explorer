import { unparse } from "papaparse";
import type { Row } from "react-table";
import type { TabularColumnInstance } from "../../helpers/tableInstanceToTabularInstance";
import getNestedObjectValue from "./getNestedObjectValue";

const transformToCsv = (
  currentDataSource: readonly any[],
  selectedColumns: Record<string, boolean>,
  columns: TabularColumnInstance<any>[]
) => {
  const filteredRows = currentDataSource.map((row: any | Row<any>) => {
    return Object.entries(selectedColumns).reduce(
      (cells, [columnId, shouldExport]) => {
        if (shouldExport) {
          const colDef = columns.find(colDef => colDef.instance.id === columnId)
            ?.definition;

          if (typeof colDef?.accessor === "string") {
            cells.push(
              getNestedObjectValue(row.original || row, columnId.split("."))
            );
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
};

export default transformToCsv;
