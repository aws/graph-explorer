import { cx } from "@emotion/css";
import { useFilter } from "@react-aria/i18n";
import { Item } from "@react-stately/collections";
import type { ForwardedRef, Key } from "react";
import { forwardRef, useMemo, useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import usePrevious from "../../hooks/usePrevious";
import ListItem from "../ListItem";
import type { SelectOption } from "../Select";
import styles from "./Autocomplete.styles";
import type { AutocompleteBoxProps } from "./AutocompleteBox";
import AutocompleteBox from "./AutocompleteBox";

export interface AutocompleteProps<T>
  extends Omit<
    AutocompleteBoxProps<T>,
    "items" | "defaultItems" | "children" | "onSelectionChange"
  > {
  options: SelectOption[];
  value?: Key;
  onChange: (key: Key) => any;
}

function Autocomplete<T>(
  {
    className,
    classNamePrefix = "ft",
    options = [],
    onChange,
    ...props
  }: AutocompleteProps<T>,
  ref: ForwardedRef<HTMLInputElement>
) {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  // Store ComboBox input value, selected option, open state, and items
  // in a state tracker
  const [searchInputValue, setSearchInputValue] = useState<string>(
    props.value as string
  );
  const { startsWith } = useFilter({ sensitivity: "base" });
  const prevValue = usePrevious(props.value);
  const currentOptions = useMemo(
    () =>
      searchInputValue
        ? options.filter(item => startsWith(item.label, searchInputValue))
        : options,
    [options, searchInputValue, startsWith]
  );

  const onSelectionChange = (key: Key) => {
    const selectedItem = options.find(option => option.value === key);
    setSearchInputValue(selectedItem?.label ?? "");
    if (key !== prevValue) {
      onChange(selectedItem?.value ?? "");
    }
  };

  // Specify how each of the ComboBox values should change when the input
  // field is altered by the user
  const onInputChange = (value: string) => {
    setSearchInputValue(value);
    if (value === "" && value !== prevValue) {
      onChange("");
    }
  };

  return (
    <div
      className={cx(
        styleWithTheme(styles.autocompleteStyles(classNamePrefix)),
        pfx("autocomplete"),
        className
      )}
    >
      <AutocompleteBox
        ref={ref}
        {...props}
        items={currentOptions}
        onInputChange={onInputChange}
        inputValue={searchInputValue}
        onSelectionChange={onSelectionChange}
        selectedKey={props.value}
      >
        {item => (
          <Item key={item.value} textValue={item.label}>
            <ListItem
              className={cx(
                styleWithTheme(styles.autocompleteStyles(classNamePrefix)),
                pfx("autocomplete-item")
              )}
            >
              {item.render ? item.render(item) : item.label}
            </ListItem>
          </Item>
        )}
      </AutocompleteBox>
    </div>
  );
}

const AutocompleteWrapper = forwardRef(Autocomplete) as <T>(
  props: AutocompleteProps<T> & { ref?: ForwardedRef<HTMLInputElement> }
) => ReturnType<typeof Autocomplete>;

export default AutocompleteWrapper;
