import type { Row } from "react-table";

import getNestedObjectValue from "./getNestedObjectValue";

const transformToJson = (
  currentDataSource: readonly any[],
  selectedColumns: Record<string, boolean>
) => {
  return currentDataSource.map((row: any | Row<any>) => {
    return Object.entries(selectedColumns).reduce(
      (cells, [columnId, shouldExport]) => {
        const pathParts = columnId.split(".");
        if (shouldExport) {
          cells[pathParts[pathParts.length - 1]] = getNestedObjectValue(
            row.original || row,
            pathParts
          );
        }

        return cells;
      },
      {} as Record<string, string | number>
    );
  }, []);
};

export default transformToJson;
