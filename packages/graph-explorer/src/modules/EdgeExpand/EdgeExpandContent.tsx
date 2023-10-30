import { useCallback, useMemo, useState } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { ModuleContainerFooter, VertexIcon } from "../../components";
import Button from "../../components/Button";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import GraphIcon from "../../components/icons/GraphIcon";
import LoadingSpinner from "../../components/LoadingSpinner";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import fade from "../../core/ThemeProvider/utils/fade";
import { useExpandNode } from "../../hooks";
import { useExpandEdge } from "../../hooks";
import useDisplayNames from "../../hooks/useDisplayNames";
import useNeighborsOptions from "../../hooks/useNeighborsOptions";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import defaultStyles from "./EdgeExpandContent.styles";
import EdgeExpandFilters, { EdgeExpandFilter } from "./EdgeExpandFilters";



export type EdgeExpandContentProps = {
  classNamePrefix?: string;
  vertex: Vertex;
  edgeList: Set<string>;
  odFlag: boolean;
  overDate: string; 
};

const EdgeExpandContent = ({
  classNamePrefix = "ft",
  vertex,
  edgeList,
  odFlag,
  overDate
}: EdgeExpandContentProps) => {
  const config = useConfiguration();
  const t = useTranslations();
  //const expandNode = useExpandNode();
  const expandEdge = useExpandEdge();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [isExpanding, setIsExpanding] = useState(false);

  const textTransform = useTextTransform();
  const neighborsOptions = useNeighborsOptions(vertex);
  const criteriaOptions = ["less than", "greater than", "like"];
  const [selectedType, setSelectedType] = useState<string>(
    neighborsOptions[0]?.value
  );
  const [filters, setFilters] = useState<Array<EdgeExpandFilter>>([]);
  const [limit, setLimit] = useState<number | null>(null);
  //const [directVal, setDirectVal] = useState<string | "">("");


  const onExpandClick = useCallback(async () => {
    setIsExpanding(true);

    await expandEdge({
      vertexId: vertex.data.id,
      vertexType: (vertex.data.types ?? [vertex.data.type])?.join("::"),
      edgeTypes: [selectedType],
      odFlag: odFlag,
      overdate: overDate,
      filterByVertexTypes: [selectedType],

      filterCriteria: filters.map(filter => ({
        name: filter.name,
        operator: "LIKE",
        value: filter.value,
      })),
      // TODO - review limit and offset when data is not sorted
      limit: limit ?? vertex.data.neighborsCount,
      offset:
        limit === null
          ? 0
          : vertex.data.neighborsCount -
            (vertex.data.__unfetchedNeighborCount ?? 0),
    });
    setIsExpanding(false);
  }, [expandEdge, filters, limit, selectedType, vertex.data]);

  const displayLabels = useMemo(() => {
    return (vertex.data.types ?? [vertex.data.type])
      .map(type => {
        return (
          config?.getVertexTypeConfig(type)?.displayLabel || textTransform(type)
        );
      })
      .filter(Boolean)
      .join(", ");
  }, [config, textTransform, vertex.data.type, vertex.data.types]);

  const getDisplayNames = useDisplayNames();
  const { name } = getDisplayNames(vertex);
  const vtConfig = config?.getVertexTypeConfig(vertex.data.type);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("header")}>
        {vtConfig?.iconUrl && (
          <div
            className={pfx("icon")}
            style={{
              background: fade(vtConfig?.color, 0.2),
              color: vtConfig?.color,
            }}
          >
            <VertexIcon
              iconUrl={vtConfig?.iconUrl}
              iconImageType={vtConfig?.iconImageType}
            />
          </div>
        )}
        <div className={pfx("content")}>
          <div className={pfx("title")}>
            {displayLabels || vertex.data.type}
          </div>
          <div>{name}</div>
        </div>
      </div>
      {vertex.data.neighborsCount === 0 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={t("edge-expand.no-connections-title")}
          subtitle={t("edge-expand.no-connections-subtitle")}
        />
      )}
      {vertex.data.neighborsCount !== 0 && (
        <>
          <NeighborsList vertex={vertex} classNamePrefix={classNamePrefix} />
          {!vertex.data.__unfetchedNeighborCount && (
            <PanelEmptyState
              icon={<GraphIcon />}
              title={t("edge-expand.no-unfetched-title")}
              subtitle={t("edge-expand.no-unfetched-subtitle")}
            />
          )}
          {!!vertex.data.__unfetchedNeighborCount && (
            <EdgeExpandFilters
              classNamePrefix={classNamePrefix}
              neighborsOptions={neighborsOptions}
              edgeOptions={edgeList}
              edgeCriteria={criteriaOptions}
              selectedType={selectedType}
              onSelectedTypeChange={setSelectedType}
              filters={filters}
              onFiltersChange={setFilters}
              limit={limit}
              onLimitChange={setLimit} />
          )}
          <div className={pfx("grow")} />
          <ModuleContainerFooter>
            <Button
              icon={
                isExpanding ? (
                  <LoadingSpinner style={{ width: 24, height: 24 }} />
                ) : (
                  <ExpandGraphIcon />
                )
              }
              variant={"filled"}
              isDisabled={
                isExpanding ||
                !vertex.data.__unfetchedNeighborCount ||
                !selectedType
              }
              onPress={onExpandClick}
            >
              Edge Expand
            </Button>
          </ModuleContainerFooter>
        </>
      )}
    </div>
  );
};

export default EdgeExpandContent;
