import { useQuery } from "@tanstack/react-query";
import { TableIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import {
  Button,
  CheckIcon,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  NavBar,
  NavBarContent,
  NavBarTitle,
  Panel,
  PanelContent,
  PanelEmptyState,
  PanelError,
  PanelGroup,
  PanelHeader,
  RouteButtonGroup,
  SchemaDiscoveryBoundary,
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
import { ExternalExportControl } from "@/components/Tabular/controls/ExportControl/ExternalExportControl";
import Tabular from "@/components/Tabular/Tabular";
import {
  type KeywordSearchRequest,
  nodeCountByNodeTypeQuery,
  searchQuery,
} from "@/connector";
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
import {
  LABELS,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
  SEARCH_TOKENS,
} from "@/utils/constants";

const DEFAULT_COLUMN = {
  width: 150,
};

export default function DataExplorer() {
  const t = useTranslations();
  const { vertexType } = useParams();
  const navigate = useNavigate();
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  if (!vertexType && vtConfigs.length > 0) {
    navigate(`/data-explorer/${encodeURIComponent(vtConfigs[0].type)}`, {
      replace: true,
    });
  }

  if (vtConfigs.length === 0 || !vertexType) {
    return (
      <Layout>
        <PanelGroup className="grid">
          <Panel>
            <PanelContent>
              <EmptyState>
                <EmptyStateIcon>
                  <TableIcon />
                </EmptyStateIcon>
                <EmptyStateContent>
                  <EmptyStateTitle>
                    No {t("node-types")} Available
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    No {t("node-types").toLocaleLowerCase()} found in the
                    connected database
                  </EmptyStateDescription>
                </EmptyStateContent>
              </EmptyState>
            </PanelContent>
          </Panel>
        </PanelGroup>
      </Layout>
    );
  }

  return (
    <Layout>
      <PanelGroup className="grid">
        <DataExplorerContent vertexType={createVertexType(vertexType)} />
      </PanelGroup>
    </Layout>
  );
}

function DataExplorerContent({ vertexType }: { vertexType: VertexType }) {
  const t = useTranslations();
  const navigate = useNavigate();

  // Automatically updates counts if needed
  useQuery(nodeCountByNodeTypeQuery(vertexType));

  const vertexConfig = useVertexTypeConfig(vertexType);
  const displayTypeConfig = useDisplayVertexTypeConfig(vertexType);
  const { pageIndex, pageSize, onPageIndexChange, onPageSizeChange } =
    usePagingOptions();

  const [tableInstance, setTableInstance] =
    useState<TabularInstance<DisplayVertex> | null>(null);
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

  return (
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
        <div className="flex items-center gap-2">
          <DisplayNameAndDescriptionOptions vertexType={vertexType} />
          {tableInstance ? (
            <ExternalExportControl
              instance={tableInstance}
              hideOptions
              forceOnlyPage
            />
          ) : null}
        </div>
      </PanelHeader>
      <Tabular
        ref={instance => {
          setTableInstance(instance);
        }}
        defaultColumn={DEFAULT_COLUMN}
        data={displayVertices}
        columns={columns}
        fullWidth={true}
        pageIndex={pageIndex}
        pageSize={pageSize}
        disablePagination={true}
        disableFilters={true}
        disableSorting={true}
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
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const config = useConfiguration();

  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle
            title="Data Explorer"
            subtitle={`Connection: ${config?.displayLabel || config?.id}`}
          />
        </NavBarContent>
        <RouteButtonGroup active="data-explorer" />
      </NavBar>
      <WorkspaceContent>
        <SchemaDiscoveryBoundary>{children}</SchemaDiscoveryBoundary>
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
      disabled={isInExplorer}
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
