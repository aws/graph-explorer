import { clone } from "lodash";
import { useCallback, useEffect } from "react";
import {
  AddIcon,
  DeleteIcon,
  IconButton,
  Input,
  Select,
} from "../../components";
import { useConfiguration, withClassNamePrefix } from "../../core";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
//import { Edge } from "../"
import { Vertex, Edge } from "../../@types/entities";

export type EdgeExpandFilter = {
  name: string;
  value: string;
};
export type EdgeExpandFiltersProps = {
  classNamePrefix?: string;
  neighborsOptions: Array<{ label: string; value: string }>;
  edgeOptions:  Set<string>;
  edgeCriteria: Array<string>;
  selectedType: string;
  //criterion: string;
  onSelectedTypeChange(type: string): void;
  filters: Array<EdgeExpandFilter>;
  onFiltersChange(filters: Array<EdgeExpandFilter>): void;
  limit: number | null;
  onLimitChange(limit: number | null): void;
};

const EdgeExpandFilters = ({
  classNamePrefix = "ft",
  neighborsOptions,
  edgeOptions,
  edgeCriteria,
  selectedType,
  onSelectedTypeChange,
  filters,
  //criterion,
  onFiltersChange,
  limit,
  onLimitChange,
}: EdgeExpandFiltersProps) => {
  const config = useConfiguration();
  const t = useTranslations();
  const textTransform = useTextTransform();
  const pfx = withClassNamePrefix(classNamePrefix);
  const vtConfig = config?.getVertexTypeConfig(selectedType);
  const etConfig = config?.getEdgeTypeConfig(selectedType);
  const searchableAttributes = config?.getVertexTypeSearchableAttributes(
    selectedType
  );
  const edgeSearchableAttributes = config?.getEdgeTypeSearchableAttributes(
    selectedType
  );
  /*const edgeSearchableAttributes = config?.getEdgeTypeSearchableAttributes(
    selectedType
  );*/
  /*
  1. get the vertex and all edges that connect to it
  2. Do something for etConfig?.attributes?.[0].name to get the names of the edge attributes
  3. Add to filterAdd

  const onFilterAdd = useCallback(() => {
    onFiltersChange([
      ...filters,
      {
        name: etConfig?.attributes?.[0].name || "",
        value: "",
      },
    ]);
  }, [filters, onFiltersChange, etConfig?.attributes]);

  */
  const onFilterAdd = useCallback(() => {
    onFiltersChange([
      ...filters,
      {
        name: "" || "",
        //name: etConfig?.attributes?.[0].name || "",
        value: "",
      },
    ]);
  }, [filters, onFiltersChange, etConfig?.attributes]);

  const onFilterDelete = useCallback(
    (filterIndex: number) => {
      const updatedFilters = filters.filter((_, i) => i !== filterIndex);
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange]
  );

  const onFilterChange = useCallback(
    (filterIndex: number, name?: string, value?: string) => {
      const currFilters = clone(filters);
      //const edge_name = filterIndex + "_" + name;
      currFilters[filterIndex].name = name || currFilters[filterIndex].name;
      currFilters[filterIndex].value = value ?? currFilters[filterIndex].value;
      onFiltersChange(currFilters);
    },
    [filters, onFiltersChange]
  );
  

  useEffect(() => {
    onFiltersChange([]);
  }, [onFiltersChange, selectedType]);

  return (
    <div className={pfx("section")}>
      <div className={pfx("title")}>{t("edge-expand.edges-of-type")}</div>
      <Select
        aria-label={"edge type"}
        value={selectedType}
        onChange={e => {
          onSelectedTypeChange(e as string);
        }}
        options={Array.from(edgeOptions).map(val =>({
          label: val,
          value: val
        }))}
      />
      {!!etConfig?.attributes?.length && (
      <div className={pfx("title")}>
        <div>Filter by Date</div>
        <IconButton
          icon={<AddIcon />}
          variant={"text"}
          size={"small"}
          onPress={onFilterAdd}
        />
      </div>
      )}
      {!!edgeSearchableAttributes?.length && (
        <div className={pfx("filters")}>
          {filters.map((filter, filterIndex) => (
            <div key={filterIndex} className={pfx("single-filter")}>
              <Input
                aria-label={"Filter"}
                className={pfx("input")}
                value={filter.value}
                onChange={value => {
                  onFilterChange(filterIndex, "J9_Record_Active_Date__c", value as string);
                }}
                hideError={true}
                noMargin={true}
              />
              <IconButton
                icon={<DeleteIcon />}
                variant={"text"}
                color={"error"}
                size={"small"}
                tooltipText={"Remove Filter"}
                onPress={() => onFilterDelete(filterIndex)}
              />
            </div>
          ))}
        </div>
      )}
      <div className={pfx("title")}>
        <div>Limit returned neighbors to</div>
        <IconButton
          icon={<AddIcon />}
          variant={"text"}
          size={"small"}
          onPress={() => onLimitChange(1)}
        />
      </div>
      {limit !== null && (
        <div className={pfx("limit")}>
          <Input
            aria-label={"limit"}
            className={pfx("input")}
            type={"number"}
            min={1}
            step={1}
            value={limit}
            onChange={(v: number | null) => onLimitChange(v ?? 0)}
            hideError={true}
            noMargin={true}
          />
          <IconButton
            icon={<DeleteIcon />}
            variant={"text"}
            color={"error"}
            size={"small"}
            tooltipText={"Remove Limit"}
            onPress={() => onLimitChange(null)}
          />
        </div>
      )}
    </div>
  );
};

export default EdgeExpandFilters;
