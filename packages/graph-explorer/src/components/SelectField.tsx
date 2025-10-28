import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import { cn } from "@/utils";
import { Label } from "./Label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./Select";
import { FormItem } from "./Form";

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
  options = [],
  value,
  onValueChange,
  label,
  labelPlacement,
  className,
  ...props
}: SelectFieldProps) {
  const selectedOption = options.find(option => option.value === value);

  if (labelPlacement === "inner") {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn("h-11 py-1", className)} {...props}>
          <div className="flex flex-col items-start justify-center gap-0">
            <div className="text-xs leading-none text-text-secondary">
              {label}
            </div>
            <SelectValue>
              {selectedOption ? (
                <RenderItem item={selectedOption} />
              ) : (
                (props.placeholder ?? "Select a value")
              )}
            </SelectValue>
          </div>
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
  }

  return (
    <FormItem>
      {label ? <Label>{label}</Label> : null}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue>
            {selectedOption ? (
              <RenderItem item={selectedOption} />
            ) : (
              (props.placeholder ?? "Select a value")
            )}
          </SelectValue>
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
