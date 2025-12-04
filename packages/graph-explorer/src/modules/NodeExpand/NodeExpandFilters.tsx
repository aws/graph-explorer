import {
  addRemoveAnimationProps,
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  IconButton,
  Input,
  Label,
  SearchResult,
  Select,
  SelectContent,
  SelectField,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components";
import { useSearchableAttributes } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import type { PropsWithChildren } from "react";
import { ListFilterPlusIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

let nextFilterId = 1;
export type NodeExpandFilter = {
  id: number;
  name: string;
  value: string;
};

export type NodeExpandFiltersProps = {
  neighborsOptions: SelectOption[];
  selectedType: string;
  onSelectedTypeChange(type: string): void;
  filters: Array<NodeExpandFilter>;
  onFiltersChange(filters: Array<NodeExpandFilter>): void;
  limit: number;
  onLimitChange(limit: number): void;
  limitEnabled: boolean;
  onLimitEnabledToggle(enabled: boolean): void;
};

function useAttributeOptions(selectedType: string) {
  const allSearchableAttributes = useSearchableAttributes(selectedType);
  return allSearchableAttributes.map(a => ({
    label: a.displayLabel,
    value: a.name,
  }));
}

const NodeExpandFilters = ({
  neighborsOptions,
  selectedType,
  onSelectedTypeChange,
  filters,
  onFiltersChange,
  limit,
  onLimitChange,
  limitEnabled,
  onLimitEnabledToggle,
}: NodeExpandFiltersProps) => {
  const t = useTranslations();

  const attributeSelectOptions = useAttributeOptions(selectedType);
  const hasSearchableAttributes = attributeSelectOptions.length > 0;

  const onFilterAdd = () => {
    onFiltersChange([
      ...filters,
      {
        id: nextFilterId++,
        name: attributeSelectOptions[0]?.value || "",
        value: "",
      },
    ]);
  };

  const onFilterDelete = (id: number) => {
    const updatedFilters = filters.filter(filter => filter.id !== id);
    onFiltersChange(updatedFilters);
  };

  const onFilterChange = (id: number, name?: string, value?: string) => {
    const currFilters = [...filters];
    const filterIndex = currFilters.findIndex(f => f.id === id);
    currFilters[filterIndex].name = name || currFilters[filterIndex].name;
    currFilters[filterIndex].value = value ?? currFilters[filterIndex].value;
    onFiltersChange(currFilters);
  };

  return (
    <div className="grow space-y-6 p-3">
      <h1 className="text-lg font-bold">Neighbor Expansion Options</h1>
      <Section>
        <SectionTitle>{t("node-expand.neighbors-of-type")}</SectionTitle>
        <SelectField
          aria-label="neighbor type"
          value={selectedType}
          onValueChange={onSelectedTypeChange}
          options={neighborsOptions}
        />
      </Section>
      {hasSearchableAttributes ? (
        <Section>
          <SectionTitle>Filter to narrow results</SectionTitle>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filters.map(filter => (
                <motion.div key={filter.id} {...addRemoveAnimationProps}>
                  <SearchResult className="grid">
                    <FieldGroup className="col-start-1 row-start-1 p-3">
                      <Field>
                        <FieldLabel htmlFor="attribute">
                          {t("property")}
                        </FieldLabel>
                        <Select
                          value={filter.name}
                          onValueChange={value => {
                            onFilterChange(filter.id, value, filter.value);
                          }}
                        >
                          <SelectTrigger id="attribute">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {attributeSelectOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="value">Value</FieldLabel>
                        <Input
                          id="value"
                          value={filter.value}
                          onChange={e => {
                            onFilterChange(
                              filter.id,
                              filter.name,
                              e.target.value,
                            );
                          }}
                        />
                      </Field>
                    </FieldGroup>
                    <IconButton
                      variant="text"
                      color="danger"
                      size="small"
                      onClick={() => onFilterDelete(filter.id)}
                      className="col-start-1 row-start-1 m-1 justify-self-end"
                      tooltipText="Remove Filter"
                    >
                      <Trash2Icon />
                    </IconButton>
                  </SearchResult>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button className="w-full" variant="outline" onClick={onFilterAdd}>
              <ListFilterPlusIcon />
              Add Filter
            </Button>
          </div>
        </Section>
      ) : null}
      <Section>
        <Label htmlFor="limitEnabled" className="block cursor-pointer">
          <SectionTitle>
            Limit returned neighbors
            <Switch
              id="limitEnabled"
              checked={limitEnabled}
              onCheckedChange={onLimitEnabledToggle}
            />
          </SectionTitle>
        </Label>
        <AnimatePresence initial={false}>
          {limitEnabled && (
            <motion.div key="limit" {...addRemoveAnimationProps}>
              <Input
                aria-label="limit"
                className="grow"
                type="number"
                min={1}
                step={1}
                value={limit}
                onChange={e => onLimitChange(parseInt(e.target.value) ?? 0)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </div>
  );
};

function Section({ children }: PropsWithChildren) {
  return <div className="space-y-4.5">{children}</div>;
}

function SectionTitle({ children }: PropsWithChildren) {
  return (
    <div className="text-text-primary flex justify-between gap-2 text-base font-medium">
      {children}
    </div>
  );
}

export default NodeExpandFilters;
