import { cx } from "@emotion/css";
import clone from "lodash/clone";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { Vertex } from "../../@types/entities";
import {
  CheckIcon,
  ChevronLeftIcon,
  LoadingSpinner,
  ModuleContainer,
  Select,
  SendIcon,
} from "../../components";
import Button from "../../components/Button";
import { ExplorerIcon } from "../../components/icons";
import ModuleContainerHeader from "../../components/ModuleContainer/components/ModuleContainerHeader";
import {
  ColumnDefinition,
  TabularFooterControls,
  TabularInstance,
} from "../../components/Tabular";
import ExternalPaginationControl from "../../components/Tabular/controls/ExternalPaginationControl";
import Tabular from "../../components/Tabular/Tabular";
import Workspace from "../../components/Workspace/Workspace";
import { KeywordSearchResponse } from "../../connector/AbstractConnector";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import {
  userStylingAtom,
  VertexPreferences,
} from "../../core/StateProvider/userPreferences";
import { useEntities } from "../../hooks";
import useFetchNode from "../../hooks/useFetchNode";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import useUpdateVertexTypeCounts from "../../hooks/useUpdateVertexTypeCounts";
import TopBarWithLogo from "../common/TopBarWithLogo";
import defaultStyles from "./DataExplorer.styles";

export type ConnectionsProps = {
  classNamePrefix?: string;
};

const DEFAULT_COLUMN = {
  width: 150,
};

const DataExplorer = ({ classNamePrefix = "ft" }: ConnectionsProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const navigate = useNavigate();
  const { vertexType } = useParams<{ vertexType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const config = useConfiguration();
  const t = useTranslations();
  const connector = useConnector();
  const fetchNode = useFetchNode();
  const [entities] = useEntities({ disableFilters: true });

  // Automatically updates counts if needed
  useUpdateVertexTypeCounts(vertexType);

  const vertexConfig = useMemo(() => {
    if (!vertexType) {
      return;
    }

    return config?.getVertexTypeConfig(vertexType);
  }, [config, vertexType]);

  const [pageIndex, setPageIndex] = useState(
    Number(searchParams.get("page") || 1) - 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize") || 20)
  );

  const onPageIndexChange = useCallback(
    (pageIndex: number) => {
      setPageIndex(pageIndex);
      setSearchParams(prevState => {
        const currPageSize = Number(prevState.get("pageSize") || 20);
        return {
          page: String(pageIndex + 1),
          pageSize: String(currPageSize),
        };
      });
    },
    // setSearchParams is not memoized and causes infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onPageSizeChange = useCallback(
    (pageSize: number) => {
      setPageSize(pageSize);
      setSearchParams(prevState => {
        const currPageIndex = Number(prevState.get("page") || 1);
        return {
          page: String(currPageIndex),
          pageSize: String(pageSize),
        };
      });
    },
    // setSearchParams is not memoized and causes infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tableRef = useRef<TabularInstance<Vertex> | null>(null);
  const textTransform = useTextTransform();
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
      cellComponent: ({ cell }) => {
        const isInExplorer = !!entities.nodes.find(
          node => node.data.id === cell.row.original.data.id
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
                fetchNode(cell.row.original);
              }}
            >
              {isInExplorer ? "Sent to Explorer" : "Send to Explorer"}
            </Button>
          </div>
        );
      },
    });

    return vtColumns;
  }, [entities.nodes, fetchNode, t, textTransform, vertexConfig?.attributes]);

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

  const updatePrefixes = usePrefixesUpdater();
  const { data, isFetching } = useQuery(
    ["keywordSearch", vertexType, pageIndex, pageSize],
    () => {
      if (!vertexType || !connector.explorer) {
        return { vertices: [] } as KeywordSearchResponse;
      }

      return connector.explorer.keywordSearch({
        vertexTypes: [vertexType],
        limit: pageSize,
        offset: pageIndex * pageSize,
      });
    },
    {
      keepPreviousData: true,
      enabled: Boolean(vertexType) && Boolean(connector.explorer),
      onSuccess: response => {
        if (!response) {
          return;
        }

        updatePrefixes(response.vertices.map(v => v.data.id));
      },
    }
  );

  const setUserStyling = useSetRecoilState(userStylingAtom);
  const onDisplayNameChange = useCallback(
    (field: "name" | "longName") => (value: string | string[]) => {
      if (!vertexType) {
        return;
      }

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
    <Workspace
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("data-explorer")
      )}
    >
      <TopBarWithLogo>
        <Workspace.TopBar.Title>
          <div>
            <div className={pfx("top-bar-title")}>Data Explorer</div>
            <div className={pfx("top-bar-subtitle")}>
              Active connection: {config?.displayLabel || config?.id}
            </div>
          </div>
        </Workspace.TopBar.Title>
        <Workspace.TopBar.AdditionalControls>
          <Link to={"/graph-explorer"}>
            <Button
              className={pfx("button")}
              icon={<ExplorerIcon />}
              variant={"filled"}
            >
              Open Graph Explorer
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </TopBarWithLogo>
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
          <div className={pfx("header-children")}>
            <Select
              className={pfx("header-select")}
              value={vertexConfig?.displayNameAttribute || ""}
              onChange={onDisplayNameChange("name")}
              options={selectOptions}
              hideError={true}
              noMargin={true}
              label={"Display Name"}
              labelPlacement={"inner"}
            />
            <Select
              className={pfx("header-select")}
              value={vertexConfig?.longDisplayNameAttribute || ""}
              onChange={onDisplayNameChange("longName")}
              options={selectOptions}
              hideError={true}
              noMargin={true}
              label={"Display Description"}
              labelPlacement={"inner"}
            />
          </div>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <ModuleContainer>
          <ModuleContainerHeader
            title={
              <div className={pfx("container-header")}>
                <div>
                  {vertexConfig?.displayLabel || textTransform(vertexType)}
                </div>
                {isFetching && <LoadingSpinner className={pfx("spinner")} />}
              </div>
            }
          />
          <Tabular
            ref={tableRef}
            defaultColumn={DEFAULT_COLUMN}
            data={data?.vertices || []}
            columns={columns}
            fullWidth={true}
            pageIndex={pageIndex}
            pageSize={pageSize}
            disablePagination={true}
            disableFilters={true}
            disableSorting={true}
          >
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
};

export default DataExplorer;
