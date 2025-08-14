import difference from "lodash/difference";
import { forwardRef } from "react";
import { NonVisibleIcon, VisibleIcon } from "@/components";
import type { ColumnDefinition, TabularInstance } from "@/components/Tabular";
import { makeIconToggleCell } from "@/components/Tabular/builders";
import {
  PlaceholderControl,
  TabularEmptyBodyControls,
} from "@/components/Tabular/controls";
import Tabular from "@/components/Tabular/Tabular";
import {
  DisplayVertex,
  useDisplayVerticesInCanvas,
  useAllNeighbors,
} from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import {
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  nodesTableFiltersAtom,
  nodesTableSortsAtom,
  useToggleFilteredNode,
} from "@/core/StateProvider/nodes";

import { useDeepMemo, useTranslations } from "@/hooks";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

type ToggleVertex = DisplayVertex & {
  __is_visible: boolean;
  neighborCounts: number;
};

const NodesTabular = forwardRef<TabularInstance<ToggleVertex>, any>(
  (_props, ref) => {
    const t = useTranslations();
    const displayNodes = useDisplayVerticesInCanvas();
    const neighborCounts = useAllNeighbors();
    const setNodesOut = useSetAtom(nodesOutOfFocusIdsAtom);
    const filteredNodes = useAtomValue(nodesFilteredIdsAtom);
    const toggleFilteredNode = useToggleFilteredNode();
    const [selectedNodesIds, setSelectedNodesIds] =
      useAtom(nodesSelectedIdsAtom);
    const setSelectedEdgesIds = useSetAtom(edgesSelectedIdsAtom);
    const [tableFilters, setTableFilters] = useAtom(nodesTableFiltersAtom);
    const [tableSorts, setTableSorts] = useAtom(nodesTableSortsAtom);

    // NOTE: Only use string accessors so that the export process continues to work
    const columns: ColumnDefinition<ToggleVertex>[] = [
      {
        unhideable: true,
        resizable: false,
        filterable: false,
        label: "Visibility",
        accessor: "__is_visible",
        cellComponent: makeIconToggleCell<ToggleVertex>({
          title: "Toggle Visibility",
          on: <NonVisibleIcon style={{ color: "#FA8500" }} />,
          off: <VisibleIcon />,
          getValue: ({ cell }) => !cell.value,
          onPress: ({ cell }) => toggleFilteredNode(cell.row.original.id),
        }),
      },
      {
        id: "node-id",
        accessor: "displayId",
        label: t("entities-tabular.node-id"),
        overflow: "ellipsis",
        oneLine: true,
      },
      {
        id: "node-type",
        accessor: "displayTypes",
        label: t("entities-tabular.node-type"),
        filter: (rows, _columnIds, filterValue) =>
          rows.filter(row =>
            row.original.displayTypes
              .toLowerCase()
              .match(filterValue.toLowerCase())
          ),
        overflow: "ellipsis",
      },
      {
        id: "displayName",
        accessor: "displayName",
        label: "Name",
        overflow: "ellipsis",
        oneLine: true,
      },
      {
        id: "displayDescription",
        accessor: "displayDescription",
        label: "Description",
        overflow: "ellipsis",
        oneLine: true,
        width: 300,
      },
      {
        accessor: "neighborCounts",
        label: "Neighbors",
        overflow: "ellipsis",
        oneLine: true,
        filterType: {
          name: "number",
          options: {
            operator: ">=",
          },
        },
      },
    ] satisfies ColumnDefinition<ToggleVertex>[];

    const data: ToggleVertex[] = useDeepMemo(() => {
      return displayNodes
        .values()
        .map(node => ({
          ...node,
          __is_visible: !filteredNodes.has(node.id),
          neighborCounts: neighborCounts.get(node.id)?.all ?? 0,
        }))
        .toArray();
    }, [filteredNodes, displayNodes, neighborCounts]);

    const onSelectRows = (rowIndex: string) => {
      const entityId = data[Number(rowIndex)].id;
      setSelectedNodesIds(new Set([entityId]));
      setSelectedEdgesIds(new Set([]));
    };

    const selectedRowsIds: Record<string, boolean> = useDeepMemo(() => {
      const selectedRows: Record<string, boolean> = {};
      Array.from(selectedNodesIds).forEach(selectedNodeId => {
        const rowIndex = data.findIndex(node => node.id === selectedNodeId);
        if (rowIndex !== -1) {
          selectedRows[rowIndex] = true;
        }
      });
      return selectedRows;
    }, [data, selectedNodesIds]);

    return (
      <Tabular
        ref={ref}
        fullWidth
        rowSelectionMode="row"
        selectedRowIds={selectedRowsIds}
        toggleRowSelected={onSelectRows}
        data={data}
        columns={columns}
        initialFilters={tableFilters}
        onDataFilteredChange={(rows, filters) => {
          const nodesIds = displayNodes.keys().toArray();
          const ids = rows.map(row => row.original.id);
          setNodesOut(new Set(difference(nodesIds, ids)));
          setTableFilters(filters);
        }}
        initialSorting={tableSorts}
        onColumnSortedChange={setTableSorts}
      >
        <TabularEmptyBodyControls>
          {data.length === 0 && (
            <PlaceholderControl>
              {t("entities-tabular.nodes-placeholder")}
            </PlaceholderControl>
          )}
        </TabularEmptyBodyControls>
      </Tabular>
    );
  }
);

export default NodesTabular;
