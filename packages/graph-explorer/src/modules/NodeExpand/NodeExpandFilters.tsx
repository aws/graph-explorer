import {
  addRemoveAnimationProps,
  Button,
  DeleteIcon,
  IconButton,
  Input,
  Label,
  SelectField,
  SelectOption,
  Switch,
} from "@/components";
import { useDisplayVertexTypeConfig } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import { PropsWithChildren } from "react";
import { PlusCircleIcon } from "lucide-react";
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

  const displayVertexTypeConfig = useDisplayVertexTypeConfig(selectedType);
  const attributeSelectOptions: SelectOption[] =
    displayVertexTypeConfig.attributes
      .filter(a => a.isSearchable)
      .map(attr => ({
        label: attr.displayLabel,
        value: attr.name,
      }));
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
    <div className="flex grow flex-col gap-6 px-3 py-4">
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
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filters.map(filter => (
                <motion.div
                  key={filter.id}
                  {...addRemoveAnimationProps}
                  className="flex w-full items-center gap-2"
                >
                  <SelectField
                    aria-label="Attribute"
                    value={filter.name}
                    onValueChange={value => {
                      onFilterChange(filter.id, value, filter.value);
                    }}
                    options={attributeSelectOptions}
                  />
                  <Input
                    aria-label="Filter"
                    className="grow"
                    value={filter.value}
                    onChange={e => {
                      onFilterChange(filter.id, filter.name, e.target.value);
                    }}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    variant="text"
                    color="danger"
                    tooltipText="Remove Filter"
                    onClick={() => onFilterDelete(filter.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <Button className="w-full" onClick={onFilterAdd}>
              <PlusCircleIcon />
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
  return <div className="space-y-3">{children}</div>;
}

function SectionTitle({ children }: PropsWithChildren) {
  return (
    <div className="text-text-primary flex justify-between gap-2 text-base font-bold">
      {children}
    </div>
  );
}

export default NodeExpandFilters;
