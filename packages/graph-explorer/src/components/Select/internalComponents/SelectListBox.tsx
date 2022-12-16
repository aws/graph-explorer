import { AriaListBoxOptions, useListBox } from "@react-aria/listbox";
import { ListProps, useListState } from "@react-stately/list";
import { useRef, useState } from "react";
import { useWithTheme } from "../../../core";
import SearchIcon from "../../icons/SearchIcon";
import Input from "../../Input";
import type { SelectOption, SelectProps } from "../Select";
import styles from "../Select.styles";
import ListBox from "./ListBox";
import SelectHeader from "./SelectHeader/SelectHeader";

type ListBoxProps<T> = ListProps<T> &
  Omit<SelectProps, "options" | "value" | "onChange"> & {
    items: Array<SelectOption>;
    classNamePrefix?: string;
  };

const SelectListBox = (props: ListBoxProps<SelectOption>) => {
  const listBoxRef = useRef(null);
  const [search, setSearch] = useState("");
  const styleWithTheme = useWithTheme();

  const state = useListState({
    ...props,
    filter: nodes =>
      !search || !props.searchable
        ? nodes
        : new Set([...nodes].filter(node => node.value.label.includes(search))),
  });
  const { listBoxProps } = useListBox(props, state, listBoxRef);

  return (
    <>
      {!!props.menuHeader && <SelectHeader {...props.menuHeader} />}
      {props.searchable && (
        <Input
          aria-label="search list"
          hideError
          noMargin
          placeholder="Search..."
          size="sm"
          className={styleWithTheme(styles.searchInputStyles)}
          startAdornment={<SearchIcon />}
          value={search}
          onChange={setSearch}
          onClick={e => e.stopPropagation()}
        />
      )}
      <ListBox
        {...(listBoxProps as AriaListBoxOptions<unknown>)}
        state={state}
        ref={listBoxRef}
      />
    </>
  );
};

export default SelectListBox;
