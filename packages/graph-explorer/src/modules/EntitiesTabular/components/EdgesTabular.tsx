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
import {
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
} from "@/core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import { useDeepMemo } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import { recoilDiffSets } from "@/utils/recoilState";
import { DisplayEdge, useDisplayEdgesInCanvas } from "@/core";

type ToggleEdge = DisplayEdge & { __is_visible: boolean };

const EdgesTabular = forwardRef<TabularInstance<ToggleEdge>, any>(
  (_props, ref) => {
    const t = useTranslations();
    const edges = useDisplayEdgesInCanvas();
    const setEdgesOut = useSetRecoilState(edgesOutOfFocusIdsAtom);
    const [hiddenEdgesIds, setHiddenEdgesIds] =
      useRecoilState(edgesFilteredIdsAtom);
    const setSelectedNodesIds = useSetRecoilState(nodesSelectedIdsAtom);
    const [selectedEdgesIds, setSelectedEdgesIds] =
      useRecoilState(edgesSelectedIdsAtom);
    const onToggleVisibility = useCallback(
      (item: ToggleEdge) => {
        recoilDiffSets(setHiddenEdgesIds, new Set([item.id]));
      },
      [setHiddenEdgesIds]
    );

    const columns: ColumnDefinition<ToggleEdge>[] = useMemo(() => {
      return [
        {
          unhideable: true,
          resizable: false,
          filterable: false,
          label: "Visibility",
          accessor: "__is_visible",
          cellComponent: makeIconToggleCell<ToggleEdge>({
            title: "Toggle Visibility",
            on: <VisibleIcon />,
            off: <NonVisibleIcon style={{ color: "#FA8500" }} />,
            getValue: ({ cell }) => !!cell.value,
            onPress: ({ cell }) => {
              onToggleVisibility(cell.row.original);
            },
          }),
        },
        {
          id: "edge-type",
          accessor: "displayTypes",
          label: t("entities-tabular.edge-type"),
          overflow: "ellipsis",
        },
        {
          id: "source-id",
          accessor: row => row.source.displayId,
          label: t("entities-tabular.source-id"),
          overflow: "ellipsis",
        },
        {
          id: "source-type",
          accessor: row => row.source.displayTypes,
          label: t("entities-tabular.source-type"),
          overflow: "ellipsis",
        },
        {
          id: "target-id",
          accessor: row => row.target.displayId,
          label: t("entities-tabular.target-id"),
          overflow: "ellipsis",
        },
        {
          id: "target-type",
          accessor: row => row.target.displayTypes,
          label: t("entities-tabular.target-type"),
          overflow: "ellipsis",
        },
      ];
    }, [t, onToggleVisibility]);

    const data: ToggleEdge[] = useDeepMemo(() => {
      return edges
        .values()
        .map(edge => ({
          ...edge,
          __is_visible: !hiddenEdgesIds.has(edge.id),
        }))
        .toArray();
    }, [edges, hiddenEdgesIds]);

    const onSelectRows = useCallback(
      (rowIndex: string) => {
        const entityId = data[Number(rowIndex)].id;
        setSelectedEdgesIds(new Set([entityId]));
        setSelectedNodesIds(new Set([]));
      },
      [data, setSelectedEdgesIds, setSelectedNodesIds]
    );

    const selectedRowsIds: Record<string, boolean> = useDeepMemo(() => {
      const selectedRows: Record<string, boolean> = {};
      Array.from(selectedEdgesIds).forEach(selectedEdgeId => {
        const rowIndex = data.findIndex(edge => edge.id === selectedEdgeId);
        if (rowIndex !== -1) {
          selectedRows[rowIndex] = true;
        }
      });
      return selectedRows;
    }, [data, selectedEdgesIds]);

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
          const edgesIds = edges.keys().toArray();
          const ids = rows.map(row => row.original.id);
          setEdgesOut(new Set(difference(edgesIds, ids)));
        }}
      >
        <TabularEmptyBodyControls>
          {data.length === 0 && (
            <PlaceholderControl>
              {t("entities-tabular.edges-placeholder")}
            </PlaceholderControl>
          )}
        </TabularEmptyBodyControls>
      </Tabular>
    );
  }
);

export default EdgesTabular;
