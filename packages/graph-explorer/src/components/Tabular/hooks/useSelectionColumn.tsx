/**
 * This hook creates a new columns placed at the first position
 * that allows to Select rows using a Checkbox
 */

import type { Hooks, Row } from "react-table";

import { Checkbox, CheckboxSizes } from "../../Checkbox/Checkbox";
import type { TabularOptions } from "../useTabular";

export const TABULAR_SELECTION_COL_ID = "__tabular-auto-generated-selection";

const useSelectionColumn = <T extends object>(options: TabularOptions<T>) => (
  hooks: Hooks<T>
) => {
  if (options.rowSelectionMode !== "checkbox") {
    return;
  }

  hooks.visibleColumns.push(columns => [
    {
      id: TABULAR_SELECTION_COL_ID,
      disableResizing: true,
      disableSortBy: true,
      minWidth: 48,
      width: 48,
      Header: ({ state, isAllRowsSelected, toggleAllRowsSelected }) => {
        const someIsSelected = Object.values(state.selectedRowIds).some(
          selection => selection === true
        );
        return (
          <Checkbox
            aria-label={"selection-header"}
            isSelected={isAllRowsSelected}
            isIndeterminate={!isAllRowsSelected && someIsSelected}
            onChange={toggleAllRowsSelected}
          />
        );
      },
      Cell: ({ row }: { row: Row<T> }) => {
        return (
          <Checkbox
            aria-label={`selection-row-${row.id}`}
            isSelected={row.isSelected}
            onChange={row.toggleRowSelected}
            size={CheckboxSizes.sm}
          />
        );
      },
    },
    ...columns,
  ]);
};

export default useSelectionColumn;
