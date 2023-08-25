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

export type EdgeExpandFilter = {
  name: string;
  value: string;
};
export type EdgeExpandFiltersProps = {
  classNamePrefix?: string;
  neighborsOptions: Array<{ label: string; value: string }>;
  selectedType: string;
  onSelectedTypeChange(type: string): void;
  filters: Array<EdgeExpandFilter>;
  onFiltersChange(filters: Array<EdgeExpandFilter>): void;
  limit: number | null;
  onLimitChange(limit: number | null): void;
};

const EdgeExpandFilters = ({
  classNamePrefix = "ft",
  neighborsOptions,
  selectedType,
  onSelectedTypeChange,
  filters,
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
  /*
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
        name: etConfig?.attributes?.[0].name || "",
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
        options={neighborsOptions}
      />
      {!!etConfig?.attributes?.length && (
        <div className={pfx("title")}>
          <div>Filter to narrow results</div>
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
              <Select
                aria-label={"Attribute"}
                value={filter.name}
                onChange={value => {
                  onFilterChange(filterIndex, value as string, filter.value);
                }}
                options={edgeSearchableAttributes?.map(attr => ({
                  label: attr.displayLabel || textTransform(attr.name),
                  value: attr.name,
                }))}
                hideError={true}
                noMargin={true}
              />
              <Input
                aria-label={"Filter"}
                className={pfx("input")}
                value={filter.value}
                onChange={value => {
                  onFilterChange(filterIndex, filter.name, value as string);
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
