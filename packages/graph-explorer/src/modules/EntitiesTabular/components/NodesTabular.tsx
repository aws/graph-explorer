import difference from "lodash/difference";
import { forwardRef, useCallback, useMemo } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { NonVisibleIcon, VisibleIcon } from "@/components";
import type { ColumnDefinition, TabularInstance } from "@/components/Tabular";
import { makeIconToggleCell } from "@/components/Tabular/builders";
import {
  PlaceholderControl,
  TabularEmptyBodyControls,
} from "@/components/Tabular/controls";
import Tabular from "@/components/Tabular/Tabular";
import { DisplayVertex, useDisplayVerticesInCanvas } from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import {
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
} from "@/core/StateProvider/nodes";

import { useDeepMemo, useTranslations } from "@/hooks";
import { recoilDiffSets } from "@/utils/recoilState";
import { useAllNeighbors } from "@/core";

type ToggleVertex = DisplayVertex & {
  __is_visible: boolean;
  neighborsCount: number;
};

const NodesTabular = forwardRef<TabularInstance<ToggleVertex>, any>(
  (_props, ref) => {
    const t = useTranslations();
    const displayNodes = useDisplayVerticesInCanvas();
    const neighborCounts = useAllNeighbors(displayNodes.values().toArray());
    const setNodesOut = useSetRecoilState(nodesOutOfFocusIdsAtom);
    const [hiddenNodesIds, setHiddenNodesIds] =
      useRecoilState(nodesFilteredIdsAtom);
    const [selectedNodesIds, setSelectedNodesIds] =
      useRecoilState(nodesSelectedIdsAtom);
    const setSelectedEdgesIds = useSetRecoilState(edgesSelectedIdsAtom);

    const onToggleVisibility = useCallback(
      (item: ToggleVertex) => {
        recoilDiffSets(setHiddenNodesIds, new Set([item.id]));
      },
      [setHiddenNodesIds]
    );

    const columns: ColumnDefinition<ToggleVertex>[] = useMemo(() => {
      return [
        {
          unhideable: true,
          resizable: false,
          filterable: false,
          label: "Visibility",
          accessor: "__is_visible",
          cellComponent: makeIconToggleCell<ToggleVertex>({
            on: <NonVisibleIcon style={{ color: "#FA8500" }} />,
            off: <VisibleIcon />,
            getValue: ({ cell }) => !cell.value,
            onPress: ({ cell }) => {
              onToggleVisibility(cell.row.original);
            },
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
          accessor: row => row.displayTypes,
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
          label: "Display Name",
          overflow: "ellipsis",
          oneLine: true,
        },
        {
          id: "displayDescription",
          accessor: "displayDescription",
          label: "Display Description",
          overflow: "ellipsis",
          oneLine: true,
          width: 300,
        },
        {
          accessor: row => neighborCounts.get(row.id)?.all ?? 0,
          label: "Total Neighbors",
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
    }, [t, onToggleVisibility, neighborCounts]);

    const data: ToggleVertex[] = useDeepMemo(() => {
      return displayNodes
        .values()
        .map(node => ({
          ...node,
          __is_visible: !hiddenNodesIds.has(node.id),
          neighborsCount: node.original.neighborsCount ?? 0,
        }))
        .toArray();
    }, [hiddenNodesIds, displayNodes]);

    const onSelectRows = useCallback(
      (rowIndex: string) => {
        const entityId = data[Number(rowIndex)].id;
        setSelectedNodesIds(new Set([entityId]));
        setSelectedEdgesIds(new Set([]));
      },
      [data, setSelectedEdgesIds, setSelectedNodesIds]
    );

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
        onDataFilteredChange={rows => {
          const nodesIds = displayNodes.keys().toArray();
          const ids = rows.map(row => row.original.id);
          setNodesOut(new Set(difference(nodesIds, ids)));
        }}
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
