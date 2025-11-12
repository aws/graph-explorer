import { cn } from "@/utils";
import { useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import {
  useUpdateSchemaFromEntities,
  type Vertex,
  type DisplayVertex,
  useConfiguration,
  useDisplayVertexTypeConfig,
  useDisplayVerticesFromVertices,
} from "@/core";
import {
  Button,
  buttonStyles,
  CheckIcon,
  ChevronLeftIcon,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateTitle,
  Panel,
  PanelError,
  PanelHeader,
  PanelTitle,
  SelectField,
  SendIcon,
  Spinner,
} from "@/components";
import { ExplorerIcon } from "@/components/icons";
import {
  type ColumnDefinition,
  PaginationControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  type TabularInstance,
} from "@/components/Tabular";
import Tabular from "@/components/Tabular/Tabular";
import Workspace from "@/components/Workspace/Workspace";
import { type KeywordSearchRequest, searchQuery } from "@/connector";
import { useVertexStyling } from "@/core/StateProvider/userPreferences";
import { useAddVertexToGraph, useHasVertexBeenAddedToGraph } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import useUpdateVertexTypeCounts from "@/hooks/useUpdateVertexTypeCounts";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";
import {
  LABELS,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";

export type ConnectionsProps = {
  vertexType: string;
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

  return <DataExplorerContent vertexType={vertexType} />;
}

function DataExplorerContent({ vertexType }: ConnectionsProps) {
  const config = useConfiguration();

  // Automatically updates counts if needed
  useUpdateVertexTypeCounts(vertexType);

  const vertexConfig = useVertexTypeConfig(vertexType);
  const displayTypeConfig = useDisplayVertexTypeConfig(vertexType);
  const { pageIndex, pageSize, onPageIndexChange, onPageSizeChange } =
    usePagingOptions();

  const tableRef = useRef<TabularInstance<DisplayVertex> | null>(null);
  const columns = useColumnDefinitions(vertexType);

  const query = useDataExplorerQuery(vertexType, pageSize, pageIndex);
  const displayVertices = useDisplayVerticesFromVertices(
    query.data?.vertices ?? []
  )
    .values()
    .toArray();

  return (
    <Workspace>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title="Data Explorer"
          subtitle={`Connection: ${config?.displayLabel || config?.id}`}
        />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <Link
            to="/graph-explorer"
            className={cn(buttonStyles({ variant: "filled" }))}
          >
            <ExplorerIcon />
            Open {LABELS.APP_NAME}
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.TopBar>
        <Workspace.TopBar.Title>
          <Link to="/connections" className={cn(buttonStyles())}>
            <ChevronLeftIcon />
            Back to all Data
          </Link>
        </Workspace.TopBar.Title>
        <Workspace.TopBar.AdditionalControls>
          <DisplayNameAndDescriptionOptions vertexType={vertexType} />
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <Panel>
          <PanelHeader>
            <PanelTitle className="flex flex-row">
              {displayTypeConfig.displayLabel}{" "}
              {query.isFetching ? <Spinner /> : null}
            </PanelTitle>
          </PanelHeader>
          <Tabular
            ref={tableRef}
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
              {query.isError ? (
                <PanelError error={query.error} onRetry={query.refetch} />
              ) : null}
              {query.data?.vertices.length === 0 && (
                <EmptyState>
                  <EmptyStateContent>
                    <EmptyStateTitle>No Data</EmptyStateTitle>
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
      </Workspace.Content>
    </Workspace>
  );
}

function DisplayNameAndDescriptionOptions({
  vertexType,
}: {
  vertexType: string;
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
      label: t("data-explorer.node-type"),
      value: RESERVED_TYPES_PROPERTY,
    });
    options.unshift({
      label: t("data-explorer.node-id"),
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
    <div style={{ display: "inline-block" }}>
      <Button
        isDisabled={isInExplorer}
        icon={isInExplorer ? <CheckIcon /> : <SendIcon />}
        variant="default"
        size="small"
        onPress={addToGraph}
      >
        {isInExplorer ? "Sent to Explorer" : "Send to Explorer"}
      </Button>
    </div>
  );
}

function useColumnDefinitions(vertexType: string) {
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
      label: t("data-explorer.node-id"),
      id: "__id",
      accessor: row => row.displayId,
      filterable: false,
    });

    vtColumns.push({
      id: "__send_to_explorer",
      label: "",
      filterable: false,
      sortable: false,
      resizable: false,
      width: 200,
      align: "right",
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
      { replace: true }
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
      { replace: true }
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
  vertexType: string,
  pageSize: number,
  pageIndex: number
) {
  const updateSchema = useUpdateSchemaFromEntities();

  const searchRequest: KeywordSearchRequest = {
    vertexTypes: [vertexType],
    limit: pageSize,
    offset: pageIndex * pageSize,
  };
  const query = useQuery({
    ...searchQuery(searchRequest, updateSchema),
    placeholderData: keepPreviousData,
  });

  return query;
}
