import difference from "lodash/difference";
import { forwardRef, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import type { Edge } from "../../../@types/entities";
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
import {
  edgesAtom,
  edgesHiddenIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
} from "../../../core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "../../../core/StateProvider/nodes";
import { useDeepMemo } from "../../../hooks";
import useTextTransform from "../../../hooks/useTextTransform";
import useTranslations from "../../../hooks/useTranslations";
import { recoilDiffSets } from "../../../utils/recoilState";

type ToggleEdge = Edge & { __is_visible: boolean };

const EdgesTabular = forwardRef<TabularInstance<any>, any>((props, ref) => {
  const t = useTranslations();
  const edges = useRecoilValue(edgesAtom);
  const setEdgesOut = useSetRecoilState(edgesOutOfFocusIdsAtom);
  const [hiddenEdgesIds, setHiddenEdgesIds] = useRecoilState(
    edgesHiddenIdsAtom
  );
  const setSelectedNodesIds = useSetRecoilState(nodesSelectedIdsAtom);
  const [selectedEdgesIds, setSelectedEdgesIds] = useRecoilState(
    edgesSelectedIdsAtom
  );
  const onToggleVisibility = useCallback(
    (item: ToggleEdge) => {
      recoilDiffSets(setHiddenEdgesIds, new Set([item.data.id]));
    },
    [setHiddenEdgesIds]
  );

  const textTransform = useTextTransform();

  const columns: ColumnDefinition<any>[] = useMemo(() => {
    return [
      {
        unhideable: true,
        resizable: false,
        filterable: false,
        label: "Visibility",
        accessor: "__is_visible",
        cellComponent: makeIconToggleCell<ToggleEdge>({
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
        accessor: row => textTransform(row.data.type),
        label: t("entities-tabular.edge-type"),
        overflow: "ellipsis",
      },
      {
        id: "source-id",
        accessor: row => textTransform(row.data.source),
        label: t("entities-tabular.source-id"),
        overflow: "ellipsis",
      },
      {
        id: "source-type",
        accessor: row => textTransform(row.data.sourceType),
        label: t("entities-tabular.source-type"),
        overflow: "ellipsis",
      },
      {
        id: "target-id",
        accessor: row => textTransform(row.data.target),
        label: t("entities-tabular.target-id"),
        overflow: "ellipsis",
      },
      {
        id: "target-type",
        accessor: row => textTransform(row.data.targetType),
        label: t("entities-tabular.target-type"),
        overflow: "ellipsis",
      },
    ];
  }, [t, onToggleVisibility, textTransform]);

  const data: ToggleEdge[] = useDeepMemo(() => {
    return edges.map(edge => ({
      ...edge,
      __is_visible: !hiddenEdgesIds.has(edge.data.id),
    }));
  }, [edges, hiddenEdgesIds]);

  const onSelectRows = useCallback(
    (rowIndex: string) => {
      const entityId = data[Number(rowIndex)].data.id;
      setSelectedEdgesIds(new Set([entityId]));
      setSelectedNodesIds(new Set([]));
    },
    [data, setSelectedEdgesIds, setSelectedNodesIds]
  );

  const selectedRowsIds: Record<string, boolean> = useDeepMemo(() => {
    const selectedRows: Record<string, boolean> = {};
    Array.from(selectedEdgesIds).forEach(selectedEdgeId => {
      const rowIndex = data.findIndex(edge => edge.data.id === selectedEdgeId);
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
      rowSelectionMode={"row"}
      selectedRowIds={selectedRowsIds}
      toggleRowSelected={onSelectRows}
      data={data}
      columns={columns as any[]}
      onDataFilteredChange={rows => {
        const edgesIds = edges.map(e => e.data.id);
        const ids = rows.map(row => row.original.data.id);
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
});

export default EdgesTabular;
