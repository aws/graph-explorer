import { cx } from "@emotion/css";
import clone from "lodash/clone";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Vertex } from "@/types/entities";
import {
  CheckIcon,
  ChevronLeftIcon,
  LoadingSpinner,
  ModuleContainer,
  PanelError,
  Select,
  SendIcon,
} from "@/components";
import Button from "@/components/Button";
import { ExplorerIcon } from "@/components/icons";
import ModuleContainerHeader from "@/components/ModuleContainer/components/ModuleContainerHeader";
import {
  ColumnDefinition,
  PlaceholderControl,
  TabularEmptyBodyControls,
  TabularFooterControls,
  TabularInstance,
} from "@/components/Tabular";
import ExternalPaginationControl from "@/components/Tabular/controls/ExternalPaginationControl";
import Tabular from "@/components/Tabular/Tabular";
import Workspace from "@/components/Workspace/Workspace";
import type { KeywordSearchRequest } from "@/connector/useGEFetchTypes";
import { useConfiguration, useWithTheme } from "@/core";
import { explorerSelector } from "@/core/connector";
import {
  userStylingAtom,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import { useEntities } from "@/hooks";
import useFetchNode from "@/hooks/useFetchNode";
import usePrefixesUpdater from "@/hooks/usePrefixesUpdater";
import useTextTransform from "@/hooks/useTextTransform";
import useTranslations from "@/hooks/useTranslations";
import useUpdateVertexTypeCounts from "@/hooks/useUpdateVertexTypeCounts";
import defaultStyles from "./DataExplorer.styles";
import { searchQuery } from "@/connector/queries";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";

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
  const navigate = useNavigate();

  const config = useConfiguration();

  // Automatically updates counts if needed
  useUpdateVertexTypeCounts(vertexType);

  const vertexConfig = useVertexTypeConfig(vertexType);
  const { pageIndex, pageSize, onPageIndexChange, onPageSizeChange } =
    usePagingOptions();

  const tableRef = useRef<TabularInstance<Vertex> | null>(null);
  const textTransform = useTextTransform();
  const columns = useColumnDefinitions(vertexType);

  const query = useDataExplorerQuery(vertexType, pageSize, pageIndex);

  const vertexTypeDisplay =
    vertexConfig?.displayLabel || textTransform(vertexType);

  return (
    <Workspace className={cx(styleWithTheme(defaultStyles), "data-explorer")}>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title="Data Explorer"
          subtitle={`Connection: ${config?.displayLabel || config?.id}`}
        />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <Link to={"/graph-explorer"}>
            <Button
              className={"button"}
              icon={<ExplorerIcon />}
              variant={"filled"}
            >
              Open Graph Explorer
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.TopBar>
        <Workspace.TopBar.Title>
          <Button
            icon={<ChevronLeftIcon />}
            onPress={() => navigate("/connections")}
          >
            Back to all Data
          </Button>
        </Workspace.TopBar.Title>
        <Workspace.TopBar.AdditionalControls>
          <DisplayNameAndDescriptionOptions vertexType={vertexType} />
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <ModuleContainer>
          <ModuleContainerHeader
            title={
              <div className={"container-header"}>
                <div>{vertexTypeDisplay}</div>
                {query.isFetching && <LoadingSpinner className={"spinner"} />}
              </div>
            }
          />
          <Tabular
            ref={tableRef}
            defaultColumn={DEFAULT_COLUMN}
            data={query.data?.vertices || []}
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
                  {`No nodes found for "${vertexTypeDisplay}"`}
                </PlaceholderControl>
              )}
            </TabularEmptyBodyControls>
            <TabularFooterControls>
              <ExternalPaginationControl
                pageIndex={pageIndex}
                onPageIndexChange={onPageIndexChange}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                totalRows={vertexConfig?.total ?? pageSize * (pageIndex + 2)}
              />
            </TabularFooterControls>
          </Tabular>
        </ModuleContainer>
      </Workspace.Content>
    </Workspace>
  );
}

function DisplayNameAndDescriptionOptions({
  vertexType,
}: {
  vertexType: string;
}) {
  const textTransform = useTextTransform();
  const t = useTranslations();
  const vertexConfig = useVertexTypeConfig(vertexType);
  const selectOptions = useMemo(() => {
    const options =
      vertexConfig?.attributes.map(attr => ({
        value: attr.name,
        label: attr.displayLabel || textTransform(attr.name),
      })) || [];

    options.unshift({
      label: t("data-explorer.node-type"),
      value: "types",
    });
    options.unshift({ label: t("data-explorer.node-id"), value: "id" });

    return options;
  }, [t, textTransform, vertexConfig?.attributes]);

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
    <div className={"header-children"}>
      <Select
        className={"header-select"}
        value={vertexConfig?.displayNameAttribute || ""}
        onChange={onDisplayNameChange("name")}
        options={selectOptions}
        hideError={true}
        noMargin={true}
        label={"Display Name"}
        labelPlacement={"inner"}
      />
      <Select
        className={"header-select"}
        value={vertexConfig?.longDisplayNameAttribute || ""}
        onChange={onDisplayNameChange("longName")}
        options={selectOptions}
        hideError={true}
        noMargin={true}
        label={"Display Description"}
        labelPlacement={"inner"}
      />
    </div>
  );
}

function AddToExplorerButton({ vertex }: { vertex: Vertex }) {
  const fetchNode = useFetchNode();
  const [entities] = useEntities({ disableFilters: true });
  const isInExplorer = !!entities.nodes.find(
    node => node.data.id === vertex.data.id
  );

  return (
    <div style={{ display: "inline-block" }}>
      <Button
        isDisabled={isInExplorer}
        icon={isInExplorer ? <CheckIcon /> : <SendIcon />}
        variant={"default"}
        size={"small"}
        iconPlacement={"start"}
        onPress={() => {
          fetchNode(vertex);
        }}
      >
        {isInExplorer ? "Sent to Explorer" : "Send to Explorer"}
      </Button>
    </div>
  );
}

function useColumnDefinitions(vertexType: string) {
  const textTransform = useTextTransform();
  const t = useTranslations();
  const vertexConfig = useVertexTypeConfig(vertexType);
  const columns: ColumnDefinition<Vertex>[] = useMemo(() => {
    const vtColumns: ColumnDefinition<Vertex>[] =
      vertexConfig?.attributes
        .map(attr => ({
          id: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
          accessor: (row: Vertex) => row.data.attributes[attr.name],
          filterType:
            attr.dataType === "String"
              ? { name: "string" as const }
              : undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) || [];

    vtColumns.unshift({
      label: t("data-explorer.node-id"),
      id: "__id",
      accessor: row => textTransform(row.data.id),
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
        <AddToExplorerButton vertex={cell.row.original} />
      ),
    });

    return vtColumns;
  }, [t, textTransform, vertexConfig?.attributes]);
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
    // setSearchParams is not memoized and causes infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
    // setSearchParams is not memoized and causes infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
  const explorer = useRecoilValue(explorerSelector);

  const updatePrefixes = usePrefixesUpdater();

  const searchRequest: KeywordSearchRequest = {
    vertexTypes: [vertexType],
    limit: pageSize,
    offset: pageIndex * pageSize,
  };
  const query = useQuery({
    ...searchQuery(searchRequest, explorer),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    updatePrefixes(query.data.vertices.map(v => v.data.id));
  }, [query.data, updatePrefixes]);

  return query;
}
