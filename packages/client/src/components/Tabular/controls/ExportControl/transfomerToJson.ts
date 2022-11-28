import type { Row } from "react-table";
import { TabularColumnInstance } from "../../helpers/tableInstanceToTabularInstance";

import getNestedObjectValue from "./getNestedObjectValue";

const transformToJson = (
  currentDataSource: readonly any[],
  selectedColumns: Record<string, boolean>,
  columns: TabularColumnInstance<any>[]
) => {
  return currentDataSource.map((row: any | Row<any>) => {
    return Object.entries(selectedColumns).reduce(
      (cells, [columnId, shouldExport]) => {
        if (shouldExport) {
          const pathParts = columnId.split(".");
          const colDef = columns.find(colDef => colDef.instance.id === columnId)
            ?.definition;

          if (typeof colDef?.accessor === "string") {
            cells[
              colDef?.label || pathParts[pathParts.length - 1]
            ] = getNestedObjectValue(row.original || row, columnId.split("."));
          } else {
            cells[
              colDef?.label || pathParts[pathParts.length - 1]
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
            ] = colDef?.accessor?.(row);
          }
        }

        return cells;
      },
      {} as Record<string, string | number>
    );
  }, []);
};

export default transformToJson;
