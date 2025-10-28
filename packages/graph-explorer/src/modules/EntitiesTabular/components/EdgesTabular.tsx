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
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  edgesTableFiltersAtom,
  edgesTableSortsAtom,
  useToggleFilteredEdge,
} from "@/core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import { useDeepMemo } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import {
  type DisplayEdge,
  type DisplayVertex,
  useDisplayEdgesInCanvas,
  useDisplayVerticesInCanvas,
} from "@/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LABELS } from "@/utils";

/** Creates the model for the table data */
function createEdgeForTable(
  edge: DisplayEdge,
  source: DisplayVertex | undefined,
  target: DisplayVertex | undefined
) {
  return {
    id: edge.id,
    displayTypes: edge.displayTypes,
    displayName: edge.displayName,
    sourceDisplayId: source?.displayId ?? LABELS.MISSING_VALUE,
    sourceDisplayTypes: source?.displayTypes ?? LABELS.MISSING_TYPE,
    targetDisplayId: target?.displayId ?? LABELS.MISSING_VALUE,
    targetDisplayTypes: target?.displayTypes ?? LABELS.MISSING_TYPE,
  };
}

/** Table data type with visibility flag */
type ToggleEdge = ReturnType<typeof createEdgeForTable> & {
  __is_visible: boolean;
};

const EdgesTabular = forwardRef<TabularInstance<ToggleEdge>, any>(
  (_props, ref) => {
    const t = useTranslations();
    const nodes = useDisplayVerticesInCanvas();
    const edges = useDisplayEdgesInCanvas();
    const setEdgesOut = useSetAtom(edgesOutOfFocusIdsAtom);
    const filteredEdges = useAtomValue(edgesFilteredIdsAtom);
    const toggleFilteredEdge = useToggleFilteredEdge();
    const setSelectedNodesIds = useSetAtom(nodesSelectedIdsAtom);
    const [selectedEdgesIds, setSelectedEdgesIds] =
      useAtom(edgesSelectedIdsAtom);
    const [tableFilters, setTableFilters] = useAtom(edgesTableFiltersAtom);
    const [tableSorts, setTableSorts] = useAtom(edgesTableSortsAtom);

    // NOTE: Only use string accessors so that the export process continues to work
    const columns: ColumnDefinition<ToggleEdge>[] = [
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
          onPress: ({ cell }) => toggleFilteredEdge(cell.row.original.id),
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
        accessor: "sourceDisplayId",
        label: t("entities-tabular.source-id"),
        overflow: "ellipsis",
      },
      {
        id: "source-type",
        accessor: "sourceDisplayTypes",
        label: t("entities-tabular.source-type"),
        overflow: "ellipsis",
      },
      {
        id: "target-id",
        accessor: "targetDisplayId",
        label: t("entities-tabular.target-id"),
        overflow: "ellipsis",
      },
      {
        id: "target-type",
        accessor: "targetDisplayTypes",
        label: t("entities-tabular.target-type"),
        overflow: "ellipsis",
      },
    ];

    const data: ToggleEdge[] = useDeepMemo(() => {
      return edges
        .values()
        .map(edge => ({
          ...createEdgeForTable(
            edge,
            nodes.get(edge.sourceId),
            nodes.get(edge.targetId)
          ),
          __is_visible: !filteredEdges.has(edge.id),
        }))
        .toArray();
    }, [edges, filteredEdges]);

    const onSelectRows = (rowIndex: string) => {
      const entityId = data[Number(rowIndex)].id;
      setSelectedEdgesIds(new Set([entityId]));
      setSelectedNodesIds(new Set([]));
    };

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
        selectedRowIds={selectedRowsIds}
        toggleRowSelected={onSelectRows}
        data={data}
        columns={columns}
        initialFilters={tableFilters}
        onDataFilteredChange={(rows, filters) => {
          const edgesIds = edges.keys().toArray();
          const ids = rows.map(row => row.original.id);
          setEdgesOut(new Set(difference(edgesIds, ids)));
          setTableFilters(filters);
        }}
        initialSorting={tableSorts}
        onColumnSortedChange={setTableSorts}
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
