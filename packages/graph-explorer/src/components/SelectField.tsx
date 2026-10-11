import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ReactNode,
} from "react";

import { cn } from "@/utils";

import { FormItem } from "./Form";
import { Label } from "./Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

export type SelectOption = {
  label: string;
  value: string;
  isDisabled?: boolean;
  render?: (props: {
    label: string;
    value: string;
    isDisabled?: boolean;
  }) => ReactNode;
};

export type SelectFieldProps = {
  options: Array<SelectOption>;
  label?: ReactNode;
  labelPlacement?: "top" | "inner";
  placeholder?: string;
  ["aria-label"]?: string;
} & Pick<ComponentPropsWithoutRef<typeof Select>, "value" | "onValueChange"> &
  ComponentPropsWithRef<typeof SelectTrigger>;

function SelectField({
  options,
  value,
  onValueChange,
  label,
  labelPlacement,
  placeholder = "Select a value",
  className,
  ...props
}: SelectFieldProps) {
  const selectedOption = options.find(option => option.value === value);
  const isInner = labelPlacement === "inner";

  const selectedValue = (
    <SelectValue>
      {selectedOption ? <RenderItem item={selectedOption} /> : placeholder}
    </SelectValue>
  );

  const select = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={isInner ? cn("h-11 py-1", className) : className}
        {...props}
      >
        {isInner ? (
          <div className="flex flex-col items-start justify-center gap-0">
            <div className="text-muted-foreground text-xs leading-none">
              {label}
            </div>
            {selectedValue}
          </div>
        ) : (
          selectedValue
        )}
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem
            value={option.value}
            key={option.value}
            disabled={option.isDisabled}
          >
            <RenderItem item={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (isInner) {
    return select;
  }

  return (
    <FormItem>
      {label ? <Label>{label}</Label> : null}
      {select}
    </FormItem>
  );
}

function RenderItem({ item }: { item: SelectOption }) {
  if (!item.render) {
    return item.label;
  }

  return item.render({
    label: item.label,
    value: item.value,
    isDisabled: item.isDisabled,
  });
}

export default SelectField;
