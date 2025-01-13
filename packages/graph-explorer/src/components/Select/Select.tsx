import { Item } from "@react-stately/collections";
import type { Selection } from "@react-types/shared";
import type { ForwardedRef, ReactNode } from "react";
import { Key } from "@react-types/shared";
import { forwardRef, useMemo } from "react";
import SelectBox from "./internalComponents/SelectBox";

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
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  label?: ReactNode;
  ["aria-label"]?: string;
  labelPlacement?: "top" | "inner";
  className?: string;
  placeholder?: string;
  errorMessage?: string;
  hideError?: boolean;
  validationState?: "valid" | "invalid";
  size?: "sm" | "md";
  noMargin?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  variant?: "default" | "text";
  allowDeselect?: boolean;
  menuWidth?: number;
};

const Select = (
  { options = [], value, onChange, ...props }: SelectProps,
  ref: ForwardedRef<HTMLButtonElement>
) => {
  const optionsValues = useMemo(() => {
    return options.map(option => option.value);
  }, [options]);

  // check if value is in the options
  const currentValue = useMemo<Iterable<Key>>(() => {
    if (value === undefined || value === null) {
      return new Set();
    }
    if (Array.isArray(value)) {
      return new Set(value.filter(val => optionsValues.includes(val)));
    }

    return optionsValues.includes(value) ? new Set([value]) : new Set();
  }, [value, optionsValues]);

  const disabledKeys = useMemo(() => {
    const disabledKeys: string[] = [];
    options.forEach(option => {
      if (option.isDisabled) {
        disabledKeys.push(option.value);
      }
    });
    return disabledKeys;
  }, [options]);
  return (
    <SelectBox
      ref={ref}
      {...props}
      onSelectionChange={(value: Selection) => {
        if (value !== "all") {
          onChange([...value][0] as string);
          return;
        } else {
          return [value];
        }
      }}
      items={options}
      selectedKeys={currentValue}
      disabledKeys={disabledKeys}
    >
      {item => (
        <Item key={item.value} textValue={item.label}>
          {item.render
            ? item.render({
                label: item.label,
                value: item.value,
                isDisabled: item.isDisabled,
              })
            : item.label}
        </Item>
      )}
    </SelectBox>
  );
};

export default forwardRef<HTMLButtonElement, SelectProps>(Select);
