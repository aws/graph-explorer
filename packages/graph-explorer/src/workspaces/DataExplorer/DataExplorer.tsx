import { cn } from "@/utils";
import clone from "lodash/clone";
import { useCallback, useMemo, useRef } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import { useSetRecoilState } from "recoil";
import { useUpdateSchemaFromEntities, Vertex } from "@/core";
import {
  Button,
  buttonStyles,
  CheckIcon,
  ChevronLeftIcon,
  LoadingSpinner,
  Panel,
  PanelError,
  PanelHeader,
  PanelTitle,
  SelectField,
  SendIcon,
} from "@/components";
import { ExplorerIcon } from "@/components/icons";
import {
  ColumnDefinition,
  PaginationControl,
  PlaceholderControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  TabularInstance,
} from "@/components/Tabular";
import Tabular from "@/components/Tabular/Tabular";
import Workspace from "@/components/Workspace/Workspace";
import { KeywordSearchRequest, searchQuery } from "@/connector";
import {
  DisplayVertex,
  useConfiguration,
  useDisplayVertexTypeConfig,
  useDisplayVerticesFromVertices,
  useWithTheme,
} from "@/core";
import { useExplorer } from "@/core/connector";
import {
  userStylingAtom,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import { useAddVertexToGraph, useHasVertexBeenAddedToGraph } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import useUpdateVertexTypeCounts from "@/hooks/useUpdateVertexTypeCounts";
import defaultStyles from "./DataExplorer.styles";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";
import {
  APP_NAME,
  MISSING_DISPLAY_VALUE,
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
  const styleWithTheme = useWithTheme();

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
    <Workspace className={cn(styleWithTheme(defaultStyles), "data-explorer")}>
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
            Open {APP_NAME}
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
            <PanelTitle>
              <div className="container-header">
                <div>{displayTypeConfig.displayLabel}</div>
                {query.isFetching && <LoadingSpinner className="spinner" />}
              </div>
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
                <PlaceholderControl>
                  {`No nodes found for "${displayTypeConfig.displayLabel}"`}
                </PlaceholderControl>
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
  const selectOptions = useMemo(() => {
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
  }, [displayConfig.attributes, t]);

  const setUserStyling = useSetRecoilState(userStylingAtom);
  const onDisplayNameChange = useCallback(
    (field: "name" | "longName") => (value: string | string[]) => {
      setUserStyling(prevStyling => {
        const vtItem =
          clone(prevStyling.vertices?.find(v => v.type === vertexType)) ||
          ({} as VertexPreferences);

        if (field === "name") {
          vtItem.displayNameAttribute = value as string;
        }

        if (field === "longName") {
          vtItem.longDisplayNameAttribute = value as string;
        }

        return {
          ...prevStyling,
          vertices: [
            ...(prevStyling.vertices || []).filter(v => v.type !== vertexType),
            {
              ...(vtItem || {}),
              type: vertexType,
            },
          ],
        };
      });
    },
    [setUserStyling, vertexType]
  );

  return (
    <div className="header-children">
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
  const columns: ColumnDefinition<DisplayVertex>[] = useMemo(() => {
    const vtColumns: ColumnDefinition<DisplayVertex>[] =
      displayConfig.attributes.map(attr => ({
        id: attr.name,
        label: attr.displayLabel,
        accessor: row =>
          row.attributes.find(a => a.name === attr.name)?.displayValue ??
          MISSING_DISPLAY_VALUE,
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
  }, [displayConfig.attributes, t]);
  return columns;
}

function usePagingOptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIndex = Number(searchParams.get("page") || 1) - 1;
  const pageSize = Number(searchParams.get("pageSize") || 20);
  const onPageIndexChange = useCallback(
    (pageIndex: number) => {
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
    },
    [setSearchParams]
  );

  const onPageSizeChange = useCallback(
    (pageSize: number) => {
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
    },
    [setSearchParams]
  );

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
  const explorer = useExplorer();
  const queryClient = useQueryClient();
  const updateSchema = useUpdateSchemaFromEntities();

  const searchRequest: KeywordSearchRequest = {
    vertexTypes: [vertexType],
    limit: pageSize,
    offset: pageIndex * pageSize,
  };
  const query = useQuery({
    ...searchQuery(searchRequest, updateSchema, explorer, queryClient),
    placeholderData: keepPreviousData,
  });

  return query;
}
