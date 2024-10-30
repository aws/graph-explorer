import difference from "lodash/difference";
import { forwardRef, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import type { Vertex } from "@/@types/entities";
import { NonVisibleIcon, VisibleIcon } from "@/components";
import type { ColumnDefinition, TabularInstance } from "@/components/Tabular";
import { makeIconToggleCell } from "@/components/Tabular/builders";
import {
  PlaceholderControl,
  TabularEmptyBodyControls,
} from "@/components/Tabular/controls";
import Tabular from "@/components/Tabular/Tabular";
import { useConfiguration } from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import {
  nodesAtom,
  nodesHiddenIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
} from "@/core/StateProvider/nodes";

import { useDeepMemo } from "@/hooks";
import useDisplayNames from "@/hooks/useDisplayNames";
import useTextTransform from "@/hooks/useTextTransform";
import useTranslations from "@/hooks/useTranslations";
import { recoilDiffSets } from "@/utils/recoilState";

type ToggleVertex = Vertex & { __is_visible: boolean };

const NodesTabular = forwardRef<TabularInstance<ToggleVertex>, any>(
  (_props, ref) => {
    const t = useTranslations();
    const nodes = useRecoilValue(nodesAtom);
    const setNodesOut = useSetRecoilState(nodesOutOfFocusIdsAtom);
    const config = useConfiguration();
    const [hiddenNodesIds, setHiddenNodesIds] =
      useRecoilState(nodesHiddenIdsAtom);
    const [selectedNodesIds, setSelectedNodesIds] =
      useRecoilState(nodesSelectedIdsAtom);
    const setSelectedEdgesIds = useSetRecoilState(edgesSelectedIdsAtom);

    const onToggleVisibility = useCallback(
      (item: ToggleVertex) => {
        recoilDiffSets(setHiddenNodesIds, new Set([item.id]));
      },
      [setHiddenNodesIds]
    );

    const textTransform = useTextTransform();

    const getDisplayNames = useDisplayNames();
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
          accessor: row => textTransform(row.id),
          label: t("entities-tabular.node-id"),
          overflow: "ellipsis",
          oneLine: true,
        },
        {
          id: "node-type",
          accessor: row =>
            (row.types ?? [row.type])
              .map(textTransform)
              .filter(Boolean)
              .join(", "),
          label: t("entities-tabular.node-type"),
          filter: (rows, _columnIds, filterValue) => {
            return rows.filter(row => {
              const vertex = row.original as Vertex;
              return (vertex.types ?? [vertex.type]).find(t => {
                const label = config?.getVertexTypeConfig(t)?.displayLabel || t;
                return label.toLowerCase().match(filterValue.toLowerCase());
              });
            });
          },
          overflow: "ellipsis",
        },
        {
          id: "displayName",
          accessor: row => getDisplayNames(row).name,
          label: "Display Name",
          overflow: "ellipsis",
          oneLine: true,
        },
        {
          id: "displayDescription",
          accessor: row => getDisplayNames(row).longName,
          label: "Display Description",
          overflow: "ellipsis",
          oneLine: true,
          width: 300,
        },
        {
          accessor: "neighborsCount",
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
    }, [config, getDisplayNames, t, onToggleVisibility, textTransform]);

    const data: ToggleVertex[] = useDeepMemo(() => {
      return nodes.map(node => ({
        ...node,
        __is_visible: !hiddenNodesIds.has(node.id),
      }));
    }, [nodes, hiddenNodesIds]);

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
        rowSelectionMode={"row"}
        selectedRowIds={selectedRowsIds}
        toggleRowSelected={onSelectRows}
        data={data}
        columns={columns}
        onDataFilteredChange={rows => {
          const nodesIds = nodes.map(n => n.id);
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
