import { Item } from "@react-stately/collections";
import type { Selection } from "@react-types/shared";
import type { CSSProperties, ForwardedRef, Key, ReactNode } from "react";
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
  labelPlacement?: "top" | "left" | "inner";
  className?: string;
  classNamePrefix?: string;
  placeholder?: string;
  errorMessage?: string;
  hideError?: boolean;
  validationState?: "valid" | "invalid";
  size?: "sm" | "md";
  noMargin?: boolean;
  selectionMode?: "single" | "multiple";
  isReadOnly?: boolean;
  isDisabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  variant?: "default" | "text";
  allowDeselect?: boolean;
  menuStyleOverride?: CSSProperties;
  menuWidth?: number;
  menuHeader?: {
    title: string;
    subtitle?: string;
  };
};

const Select = (
  {
    options = [],
    value,
    onChange,
    selectionMode = "single",
    ...props
  }: SelectProps,
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
      selectionMode={selectionMode}
      onSelectionChange={(value: Selection) => {
        if (selectionMode === "single" && value !== "all") {
          onChange([...value][0] as string);
          return;
        }

        if (value === "all") {
          return [value];
        }

        onChange([...value] as string[]);
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
