import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import {
  Button,
  CheckIcon,
  ConnectionsRouteButton,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateTitle,
  GraphExplorerRouteButton,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  NavBarVersion,
  Panel,
  PanelEmptyState,
  PanelError,
  PanelGroup,
  PanelHeader,
  SelectField,
  SendIcon,
  Spinner,
  Workspace,
  WorkspaceContent,
} from "@/components";
import {
  type ColumnDefinition,
  PaginationControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  type TabularInstance,
} from "@/components/Tabular";
import Tabular from "@/components/Tabular/Tabular";
import { type KeywordSearchRequest, searchQuery } from "@/connector";
import {
  createVertexType,
  type DisplayVertex,
  useConfiguration,
  useDisplayVertexTypeConfig,
  useDisplayVertexTypeConfigs,
  useDisplayVerticesFromVertices,
  useUpdateSchemaFromEntities,
  type Vertex,
  type VertexType,
} from "@/core";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";
import { useVertexStyling } from "@/core/StateProvider/userPreferences";
import { useAddVertexToGraph, useHasVertexBeenAddedToGraph } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import useUpdateVertexTypeCounts from "@/hooks/useUpdateVertexTypeCounts";
import { logger } from "@/utils";
import {
  LABELS,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
  SEARCH_TOKENS,
} from "@/utils/constants";

export type ConnectionsProps = {
  vertexType: VertexType;
};

const DEFAULT_COLUMN = {
  width: 150,
};

export default function DataExplorer() {
  const { vertexType } = useParams();

  if (!vertexType) {
    // React Router will redirect if vertexType is not defined before reaching here.
    return <>No vertex type was defined</>;
  }

  return <DataExplorerContent vertexType={createVertexType(vertexType)} />;
}

function DataExplorerContent({ vertexType }: ConnectionsProps) {
  const t = useTranslations();
  const config = useConfiguration();
  const navigate = useNavigate();

  // Automatically updates counts if needed
  useUpdateVertexTypeCounts(vertexType);

  const vertexConfig = useVertexTypeConfig(vertexType);
  const displayTypeConfig = useDisplayVertexTypeConfig(vertexType);
  const { pageIndex, pageSize, onPageIndexChange, onPageSizeChange } =
    usePagingOptions();

  const [tableInstance, setTableInstance] =
    useState<TabularInstance<DisplayVertex> | null>();
  const columns = useColumnDefinitions(vertexType);

  const query = useDataExplorerQuery(vertexType, pageSize, pageIndex);
  const displayVertices = useDisplayVerticesFromVertices(
    query.data?.vertices ?? [],
  )
    .values()
    .toArray();

  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();
  const vertexTypeOptions = vtConfigs.map(config => ({
    value: config.type,
    label: config.displayLabel,
  }));

  const onVertexTypeChange = (value: string | string[]) => {
    const newType = Array.isArray(value) ? value[0] : value;
    navigate(`/data-explorer/${encodeURIComponent(newType)}`, {
      replace: true,
    });
  };

  useEffect(() => {
    logger.log(tableInstance?.filters);
  }, [tableInstance?.filters]);

  useEffect(() => {
    logger.log(tableInstance?.sorts);
  }, [tableInstance?.sorts]);

  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle
            title="Data Explorer"
            subtitle={`Connection: ${config?.displayLabel || config?.id}`}
          />
        </NavBarContent>
        <NavBarActions>
          <NavBarVersion>{__GRAPH_EXP_VERSION__}</NavBarVersion>
          <ConnectionsRouteButton />
          <GraphExplorerRouteButton variant="filled" />
        </NavBarActions>
      </NavBar>
      <WorkspaceContent>
        <PanelGroup className="grid">
          <Panel>
            <PanelHeader className="justify-between py-3">
              <SelectField
                className="w-64"
                value={vertexType}
                onValueChange={onVertexTypeChange}
                options={vertexTypeOptions}
                label={t("node-type")}
                labelPlacement="inner"
              />
              <DisplayNameAndDescriptionOptions vertexType={vertexType} />
            </PanelHeader>
            <Tabular
              ref={instance => setTableInstance(instance)}
              defaultColumn={DEFAULT_COLUMN}
              data={displayVertices}
              columns={columns}
              fullWidth={true}
              pageIndex={pageIndex}
              pageSize={pageSize}
              disablePagination={true}
              manualFilters={true}
              manualSorting={true}
            >
              <TabularEmptyBodyControls>
                {query.isPending ? (
                  <PanelEmptyState title="Loading data..." icon={<Spinner />} />
                ) : null}
                {query.isError ? (
                  <PanelError error={query.error} onRetry={query.refetch} />
                ) : null}
                {query.data?.vertices.length === 0 && (
                  <EmptyState>
                    <EmptyStateContent>
                      <EmptyStateTitle>No Results</EmptyStateTitle>
                      <EmptyStateDescription>
                        {`No nodes found for "${displayTypeConfig.displayLabel}"`}
                      </EmptyStateDescription>
                    </EmptyStateContent>
                  </EmptyState>
                )}
              </TabularEmptyBodyControls>
              <TabularFooterControls>
                <PaginationControl
                  pageIndex={pageIndex}
                  onPageIndexChange={onPageIndexChange}
                  pageSize={pageSize}
                  onPageSizeChange={onPageSizeChange}
                  totalRows={vertexConfig?.total ?? pageSize * (pageIndex + 2)}
                />
              </TabularFooterControls>
            </Tabular>
          </Panel>
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}

function DisplayNameAndDescriptionOptions({
  vertexType,
}: {
  vertexType: VertexType;
}) {
  const t = useTranslations();
  const vertexConfig = useVertexTypeConfig(vertexType);
  const displayConfig = useDisplayVertexTypeConfig(vertexType);
  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    options.unshift({
      label: t("node-type"),
      value: RESERVED_TYPES_PROPERTY,
    });
    options.unshift({
      label: t("node-id"),
      value: RESERVED_ID_PROPERTY,
    });

    return options;
  })();

  const { setVertexStyle: setPreferences } = useVertexStyling(vertexType);
  const onDisplayNameChange =
    (field: "name" | "longName") => (value: string | string[]) => {
      if (field === "name") {
        setPreferences({ displayNameAttribute: value as string });
      }

      if (field === "longName") {
        setPreferences({ longDisplayNameAttribute: value as string });
      }
    };

  return (
    <div className="flex flex-wrap gap-2">
      <SelectField
        className="w-[200px]"
        value={vertexConfig?.displayNameAttribute || ""}
        onValueChange={onDisplayNameChange("name")}
        options={selectOptions}
        label="Display Name"
        labelPlacement="inner"
      />
      <SelectField
        className="w-[200px]"
        value={vertexConfig?.longDisplayNameAttribute || ""}
        onValueChange={onDisplayNameChange("longName")}
        options={selectOptions}
        label="Display Description"
        labelPlacement="inner"
      />
    </div>
  );
}

function AddToExplorerButton({ vertex }: { vertex: Vertex }) {
  const addToGraph = useAddVertexToGraph(vertex);
  const isInExplorer = useHasVertexBeenAddedToGraph(vertex.id);

  return (
    <Button
      isDisabled={isInExplorer}
      variant="outline"
      size="small"
      onClick={addToGraph}
      className="text-nowrap"
    >
      {isInExplorer ? <CheckIcon /> : <SendIcon />}
      {isInExplorer ? "Sent to Explorer" : "Send to Explorer"}
    </Button>
  );
}

function useColumnDefinitions(vertexType: VertexType) {
  const t = useTranslations();
  const displayConfig = useDisplayVertexTypeConfig(vertexType);
  const columns: ColumnDefinition<DisplayVertex>[] = (() => {
    const vtColumns: ColumnDefinition<DisplayVertex>[] =
      displayConfig.attributes.map(attr => ({
        id: attr.name,
        label: attr.displayLabel,
        accessor: row =>
          row.attributes.find(a => a.name === attr.name)?.displayValue ??
          LABELS.MISSING_VALUE,
      }));
    vtColumns.unshift({
      label: t("node-id"),
      id: SEARCH_TOKENS.NODE_ID,
      accessor: row => row.displayId,
      filterable: false,
    });

    vtColumns.push({
      id: "__send_to_explorer",
      label: "",
      filterable: false,
      sortable: false,
      resizable: false,
      width: 180,
      cellComponent: ({ cell }) => (
        <AddToExplorerButton vertex={cell.row.original.original} />
      ),
    });

    return vtColumns;
  })();
  return columns;
}

function usePagingOptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIndex = Number(searchParams.get("page") || 1) - 1;
  const pageSize = Number(searchParams.get("pageSize") || 20);
  const onPageIndexChange = (pageIndex: number) => {
    setSearchParams(
      prevState => {
        const currPageSize = Number(prevState.get("pageSize") || 20);
        return {
          page: String(pageIndex + 1),
          pageSize: String(currPageSize),
        };
      },
      { replace: true },
    );
  };

  const onPageSizeChange = (pageSize: number) => {
    setSearchParams(
      prevState => {
        const currPageIndex = Number(prevState.get("page") || 1);
        return {
          page: String(currPageIndex),
          pageSize: String(pageSize),
        };
      },
      { replace: true },
    );
  };

  return {
    pageIndex,
    pageSize,
    onPageIndexChange,
    onPageSizeChange,
  };
}

function useDataExplorerQuery(
  vertexType: VertexType,
  pageSize: number,
  pageIndex: number,
) {
  const updateSchema = useUpdateSchemaFromEntities();

  const searchRequest: KeywordSearchRequest = {
    vertexTypes: [vertexType],
    limit: pageSize,
    offset: pageIndex * pageSize,
  };

  return useQuery(searchQuery(searchRequest, updateSchema));
}
