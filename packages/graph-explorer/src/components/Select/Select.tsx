import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ForwardedRef,
  ReactNode,
} from "react";
import { forwardRef } from "react";
import {
  FormItem,
  Label,
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../radix";
import React from "react";
import { cn } from "@/utils";

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

export { Item, Section } from "@react-stately/collections";

export type SelectProps = {
  options: Array<SelectOption>;
  label?: ReactNode;
  labelPlacement?: "top" | "inner";
  placeholder?: string;
  ["aria-label"]?: string;
} & Pick<ComponentProps<typeof RadixSelect>, "value" | "onValueChange"> &
  ComponentPropsWithoutRef<typeof SelectTrigger>;

function Select(
  {
    options = [],
    value,
    onValueChange,
    label,
    labelPlacement,
    className,
    ...props
  }: SelectProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const selectedOption = options.find(option => option.value === value);

  if (labelPlacement === "inner") {
    return (
      <RadixSelect value={value} onValueChange={onValueChange}>
        <SelectTrigger ref={ref} className={cn("h-11", className)} {...props}>
          <div className="flex flex-col items-start justify-center gap-0">
            <div className="text-text-secondary text-xs leading-none">
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
      </RadixSelect>
    );
  }

  return (
    <FormItem>
      {label ? <Label>{label}</Label> : null}
      <RadixSelect value={value} onValueChange={onValueChange}>
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
      </RadixSelect>
    </FormItem>
  );
}

const RenderItem = React.memo(function ({ item }: { item: SelectOption }) {
  if (!item.render) {
    return item.label;
  }

  return item.render({
    label: item.label,
    value: item.value,
    isDisabled: item.isDisabled,
  });
});

export default forwardRef<HTMLButtonElement, SelectProps>(Select);
