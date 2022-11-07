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
import HumanReadableNumberFormatter from "../../components/HumanReadableNumberFormatter";
import ExplorerIcon from "../../components/icons/ExplorerIcon";
import ModuleContainerHeader from "../../components/ModuleContainer/components/ModuleContainerHeader";
import { useNotification } from "../../components/NotificationProvider";
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
import { schemaAtom } from "../../core/StateProvider/schema";
import {
  userStylingAtom,
  VertexPreferences,
} from "../../core/StateProvider/userPreferences";
import { useEntities } from "../../hooks";
import useFetchNode from "../../hooks/useFetchNode";
import useTextTransform from "../../hooks/useTextTransform";
import labelsByEngine from "../../utils/labelsByEngine";
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
  const connector = useConnector();
  const fetchNode = useFetchNode();
  const [entities] = useEntities({ disableFilters: true });

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

  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];
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
      label: labels["node-id"],
      id: "id",
      accessor: row => textTransform(row.data.__v_id),
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
  }, [
    entities.nodes,
    fetchNode,
    labels,
    textTransform,
    vertexConfig?.attributes,
  ]);

  const selectOptions = useMemo(() => {
    const options =
      vertexConfig?.attributes.map(attr => ({
        value: attr.name,
        label: attr.displayLabel || textTransform(attr.name),
      })) || [];

    options.unshift({ label: labels["node-type"], value: "__v_types" });
    options.unshift({ label: labels["node-id"], value: "__v_id" });

    return options;
  }, [labels, textTransform, vertexConfig?.attributes]);

  const { enqueueNotification } = useNotification();
  const setSchema = useSetRecoilState(schemaAtom);
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

        if (response.prefixes?.length !== 0) {
          setSchema(prevSchemaMap => {
            if (!config?.id) {
              return prevSchemaMap;
            }

            const updatedSchema = new Map(prevSchemaMap);
            const schema = updatedSchema.get(config.id);
            updatedSchema.set(config.id, {
              // Update prefixes does not affect to sync last update date
              lastUpdate: schema?.lastUpdate,
              vertices: schema?.vertices || [],
              edges: schema?.edges || [],
              prefixes: [
                ...(schema?.prefixes || []),
                ...(response.prefixes || []),
              ],
            });
            return updatedSchema;
          });

          enqueueNotification({
            title: "Prefixes updated",
            message:
              response.prefixes?.length === 1
                ? "1 new prefix has been generated"
                : `${response.prefixes?.length} new prefixes have been generated`,
            type: "success",
            stackable: true,
          });
        }
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
            subtitle={
              <div>
                Total:{" "}
                {vertexConfig?.total != null && (
                  <HumanReadableNumberFormatter
                    className={pfx("vertex-count")}
                    value={vertexConfig?.total}
                  />
                )}
                {vertexConfig?.total == null && "Unknown total"}
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
