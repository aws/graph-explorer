import { useAtom, useAtomValue, useSetAtom } from "jotai";
import difference from "lodash/difference";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import type { ColumnDefinition, TabularInstance } from "@/components/Tabular";

import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components";
import { makeIconToggleCell } from "@/components/Tabular/builders";
import { TabularEmptyBodyControls } from "@/components/Tabular/controls";
import Tabular from "@/components/Tabular/Tabular";
import {
  type DisplayVertex,
  useAllNeighbors,
  useDisplayVerticesInCanvas,
} from "@/core";
import {
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesTableFiltersAtom,
  nodesTableSortsAtom,
  useToggleFilteredNode,
} from "@/core/StateProvider/nodes";
import { useDeepMemo, useTranslations } from "@/hooks";
import { useGraphSelection } from "@/modules/GraphViewer/useGraphSelection";

type ToggleVertex = DisplayVertex & {
  __is_visible: boolean;
  neighborCounts: number;
};

interface NodesTabularProps {
  ref?: React.Ref<TabularInstance<ToggleVertex>>;
}

function NodesTabular({ ref }: NodesTabularProps) {
  const t = useTranslations();
  const displayNodes = useDisplayVerticesInCanvas();
  const neighborCounts = useAllNeighbors();
  const setNodesOut = useSetAtom(nodesOutOfFocusIdsAtom);
  const filteredNodes = useAtomValue(nodesFilteredIdsAtom);
  const toggleFilteredNode = useToggleFilteredNode();
  const { graphSelection, replaceGraphSelection } = useGraphSelection();
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
        on: <EyeIcon />,
        off: <EyeOffIcon />,
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
            .match(filterValue.toLowerCase()),
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
    replaceGraphSelection({ vertices: [entityId] });
  };

  const selectedRowsIds: Record<string, boolean> = useDeepMemo(() => {
    const selectedRows: Record<string, boolean> = {};
    graphSelection.vertices.forEach(selectedNodeId => {
      const rowIndex = data.findIndex(node => node.id === selectedNodeId);
      if (rowIndex !== -1) {
        selectedRows[rowIndex] = true;
      }
    });
    return selectedRows;
  }, [data, graphSelection]);

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
          <EmptyState>
            <EmptyStateContent>
              <EmptyStateTitle>Empty Graph</EmptyStateTitle>
              <EmptyStateDescription>
                {t("entities-tabular.nodes-placeholder")}
              </EmptyStateDescription>
            </EmptyStateContent>
          </EmptyState>
        )}
      </TabularEmptyBodyControls>
    </Tabular>
  );
}

export default NodesTabular;
