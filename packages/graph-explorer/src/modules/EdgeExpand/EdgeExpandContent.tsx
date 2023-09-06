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
// import useEdgeOptions from "../../hooks/useEdgeOptions";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import defaultStyles from "./EdgeExpandContent.styles";
import EdgeExpandFilters, { EdgeExpandFilter } from "./EdgeExpandFilters";
import useFindEdge from "../../hooks/useFindEdge";


export type EdgeExpandContentProps = {
  classNamePrefix?: string;
  vertex: Vertex;
  edgeList: Set<string>; 
};

const EdgeExpandContent = ({
  classNamePrefix = "ft",
  vertex,
  edgeList,
}: EdgeExpandContentProps) => {
  const config = useConfiguration();
  const t = useTranslations();
  //const expandNode = useExpandNode();
  const expandEdge = useExpandEdge();
  const testEdge = useExpandEdge();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [isExpanding, setIsExpanding] = useState(false);

  const textTransform = useTextTransform();
  const neighborsOptions = useNeighborsOptions(vertex);
  //const testEdge = useFindEdge();
  //console.log(edgesList)
  const criteriaOptions = ["less than", "greater than", "like"];
  //const findEdge = ["CreatedById", "CreatedDate", "Id", "J2_Drug_ID__c", "J2_NDC__c", "J2_Offer_ID__c", "J2_Ready_for_Review__c", "J2_Record_Active_Date__c", "J2_Record_Expiration_Date__c", "J2_Reviewed_and_Approved__c", "LastModifiedById", "LastModifiedDate", "Name", "OwnerId"];
  const [selectedType, setSelectedType] = useState<string>(
    neighborsOptions[0]?.value
  );
  const [filters, setFilters] = useState<Array<EdgeExpandFilter>>([]);
  const [limit, setLimit] = useState<number | null>(null);


  const onExpandClick = useCallback(async () => {
    setIsExpanding(true);
    const testResult = await testEdge({
      vertexId: vertex.data.id,
      vertexType: "drug",
      edgeTypes: ["j2"],
      filterCriteria:[{
        name:"J2_Record_Expiration_Date__c",
        operator:">",
        value:"2024-0-01"
      }],
    })
    console.log(testResult)
    await expandEdge({
      vertexId: vertex.data.id,
      vertexType: (vertex.data.types ?? [vertex.data.type])?.join("::"),
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

  /* const getEdgeData = testEdge({
      vertexId: vertex.data.id
    }); */

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
  //const etConfig = config?.getEdgeTypeConfig(edge.data.type);
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
        /*
        <NeighborsList vertex={vertex} classNamePrefix={classNamePrefix} />
        <EdgesList vertex={vertex} classNamePrefix={classNamePrefix}
        */
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
