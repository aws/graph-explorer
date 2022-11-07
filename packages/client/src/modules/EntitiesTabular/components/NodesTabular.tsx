import difference from "lodash/difference";
import { forwardRef, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import type { Vertex, VertexData } from "../../../@types/entities";
import { NonVisibleIcon, VisibleIcon } from "../../../components";
import type {
  ColumnDefinition,
  TabularInstance,
} from "../../../components/Tabular";
import { makeIconToggleCell } from "../../../components/Tabular/builders";
import {
  PlaceholderControl,
  TabularEmptyBodyControls,
} from "../../../components/Tabular/controls";
import Tabular from "../../../components/Tabular/Tabular";
import { useConfiguration } from "../../../core";
import {
  nodesAtom,
  nodesHiddenIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
} from "../../../core/StateProvider/nodes";

import { useDeepMemo } from "../../../hooks";
import useDisplayNames from "../../../hooks/useDisplayNames";
import useTextTransform from "../../../hooks/useTextTransform";
import labelsByEngine from "../../../utils/labelsByEngine";
import { recoilDiffSets } from "../../../utils/recoilState";

type ToggleVertex = Vertex & { __is_visible: boolean };

const NodesTabular = forwardRef<TabularInstance<any>, any>((props, ref) => {
  const nodes = useRecoilValue(nodesAtom);
  const setNodesOut = useSetRecoilState(nodesOutOfFocusIdsAtom);
  const config = useConfiguration();
  const [hiddenNodesIds, setHiddenNodesIds] = useRecoilState(
    nodesHiddenIdsAtom
  );
  const [selectedNodesIds, setSelectedNodesIds] = useRecoilState(
    nodesSelectedIdsAtom
  );

  const onToggleVisibility = useCallback(
    (item: ToggleVertex) => {
      recoilDiffSets(setHiddenNodesIds, new Set([item.data.id]));
    },
    [setHiddenNodesIds]
  );

  const textTransform = useTextTransform();
  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];

  const getDisplayNames = useDisplayNames();
  const columns: ColumnDefinition<any>[] = useMemo(() => {
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
        accessor: row => textTransform(row.data.__v_id),
        label: labels["node-id"],
        overflow: "ellipsis",
        oneLine: true,
      },
      {
        id: "node-type",
        accessor: "data",
        label: labels["node-type"],
        filter: (rows, _columnIds, filterValue) => {
          return rows.filter(row => {
            const vertex = row.original.data as VertexData;
            return vertex.__v_types.find(t => {
              const label = config?.getVertexTypeConfig(t)?.displayLabel || t;
              return label.toLowerCase().match(filterValue.toLowerCase());
            });
          });
        },
        overflow: "ellipsis",
        cellComponent: ({ cell }) => {
          const vertex = cell.value as VertexData;
          return vertex?.__v_types
            .map(type => {
              const vtConfig = config?.getVertexTypeConfig(type);
              return textTransform(vtConfig?.displayLabel || vtConfig?.type);
            })
            .filter(Boolean)
            .join(", ");
        },
      },
      {
        id: "__name",
        accessor: row => getDisplayNames(row).name,
        label: "Display Name",
        overflow: "ellipsis",
        oneLine: true,
      },
      {
        id: "__longName",
        accessor: row => getDisplayNames(row).longName,
        label: "Display Description",
        overflow: "ellipsis",
        oneLine: true,
        width: 300,
      },
      {
        accessor: "data.__totalNeighborCount",
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
    ];
  }, [config, getDisplayNames, labels, onToggleVisibility, textTransform]);

  const data: ToggleVertex[] = useDeepMemo(() => {
    return nodes.map(node => ({
      ...node,
      __is_visible: !hiddenNodesIds.has(node.data.id),
    }));
  }, [nodes, hiddenNodesIds]);

  const onSelectRows = useCallback(
    (rowIndex: string) => {
      const copiedSet = new Set(selectedNodesIds);
      const entityId = data[Number(rowIndex)].data.id;
      if (copiedSet.has(entityId)) {
        copiedSet.delete(entityId);
      } else {
        copiedSet.add(entityId);
      }
      setSelectedNodesIds(copiedSet);
    },
    [data, selectedNodesIds, setSelectedNodesIds]
  );

  const selectedRowsIds: Record<string, boolean> = useDeepMemo(() => {
    const selectedRows: Record<string, boolean> = {};
    Array.from(selectedNodesIds).forEach(selectedNodeId => {
      const rowIndex = data.findIndex(node => node.data.id === selectedNodeId);
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
      columns={columns as any[]}
      onDataFilteredChange={rows => {
        const nodesIds = nodes.map(n => n.data.id);
        const ids = rows.map(row => row.original.data.id);
        setNodesOut(new Set(difference(nodesIds, ids)));
      }}
    >
      <TabularEmptyBodyControls>
        {data.length === 0 && (
          <PlaceholderControl>
            {labels["nodes-tabular-placeholder"]}
          </PlaceholderControl>
        )}
      </TabularEmptyBodyControls>
    </Tabular>
  );
});

export default NodesTabular;
