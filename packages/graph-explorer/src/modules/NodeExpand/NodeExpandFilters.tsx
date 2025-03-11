import { clone } from "lodash";
import { useCallback } from "react";
import {
  AddIcon,
  DeleteIcon,
  IconButton,
  InfoTooltip,
  InputField,
  SelectField,
  SelectOption,
} from "@/components";
import { useDisplayVertexTypeConfig } from "@/core";
import useTranslations from "@/hooks/useTranslations";

export type NodeExpandFilter = {
  name: string;
  value: string;
};

export type NodeExpandFiltersProps = {
  neighborsOptions: SelectOption[];
  selectedType: string;
  onSelectedTypeChange(type: string): void;
  filters: Array<NodeExpandFilter>;
  onFiltersChange(filters: Array<NodeExpandFilter>): void;
  limit: number | null;
  onLimitChange(limit: number | null): void;
};

const NodeExpandFilters = ({
  neighborsOptions,
  selectedType,
  onSelectedTypeChange,
  filters,
  onFiltersChange,
  limit,
  onLimitChange,
}: NodeExpandFiltersProps) => {
  const t = useTranslations();

  const displayVertexTypeConfig = useDisplayVertexTypeConfig(selectedType);
  const attributeSelectOptions: SelectOption[] =
    displayVertexTypeConfig.attributes
      .filter(a => a.isSearchable)
      .map(attr => ({
        label: attr.displayLabel,
        value: attr.name,
      }));
  const hasSearchableAttributes = attributeSelectOptions.length > 0;

  const onFilterAdd = useCallback(() => {
    onFiltersChange([
      ...filters,
      {
        name: attributeSelectOptions[0]?.value || "",
        value: "",
      },
    ]);
  }, [attributeSelectOptions, filters, onFiltersChange]);

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

  return (
    <div className="filters-section">
      <div className="title">{t("node-expand.neighbors-of-type")}</div>
      <SelectField
        aria-label="neighbor type"
        value={selectedType}
        onValueChange={onSelectedTypeChange}
        options={neighborsOptions}
      />
      {hasSearchableAttributes && (
        <div className="title">
          <div>Filter to narrow results</div>
          <IconButton
            icon={<AddIcon />}
            variant="text"
            size="small"
            onClick={onFilterAdd}
          />
        </div>
      )}
      {filters.length > 0 && (
        <div className="filters">
          {filters.map((filter, filterIndex) => (
            <div key={filterIndex} className="single-filter">
              <SelectField
                aria-label="Attribute"
                value={filter.name}
                onValueChange={value => {
                  onFilterChange(filterIndex, value, filter.value);
                }}
                options={attributeSelectOptions}
              />
              <InputField
                aria-label="Filter"
                className="input"
                value={filter.value}
                onChange={value => {
                  onFilterChange(filterIndex, filter.name, value);
                }}
                hideError={true}
                noMargin={true}
              />
              <IconButton
                icon={<DeleteIcon />}
                variant="text"
                color="error"
                tooltipText="Remove Filter"
                onClick={() => onFilterDelete(filterIndex)}
              />
            </div>
          ))}
        </div>
      )}
      <div className="title">
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          Limit returned neighbors to
          <InfoTooltip>
            Please use full expansion if all the expected nodes are not returned
            from limited expansion.
          </InfoTooltip>
        </div>
        <IconButton
          icon={<AddIcon />}
          variant="text"
          size="small"
          onClick={() => onLimitChange(1)}
        />
      </div>
      {limit !== null && (
        <div className="limit">
          <InputField
            aria-label="limit"
            className="input"
            type="number"
            min={1}
            step={1}
            value={limit}
            onChange={(v: number | null) => onLimitChange(v ?? 0)}
            hideError={true}
            noMargin={true}
          />
          <IconButton
            icon={<DeleteIcon />}
            variant="text"
            color="error"
            tooltipText="Remove Limit"
            onClick={() => onLimitChange(null)}
          />
        </div>
      )}
    </div>
  );
};

export default NodeExpandFilters;
