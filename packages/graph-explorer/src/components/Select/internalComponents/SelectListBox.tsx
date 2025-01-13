import { AriaListBoxOptions, useListBox } from "@react-aria/listbox";
import { ListProps, useListState } from "@react-stately/list";
import { useRef } from "react";
import type { SelectOption, SelectProps } from "../Select";
import ListBox from "./ListBox";

type ListBoxProps<T> = ListProps<T> &
  Omit<SelectProps, "options" | "value" | "onChange"> & {
    items: Array<SelectOption>;
  };

const SelectListBox = (props: ListBoxProps<SelectOption>) => {
  const listBoxRef = useRef(null);

  const state = useListState({
    ...props,
    filter: nodes => nodes,
  });
  const { listBoxProps } = useListBox(props, state, listBoxRef);

  return (
    <ListBox
      {...(listBoxProps as AriaListBoxOptions<unknown>)}
      state={state}
      ref={listBoxRef}
    />
  );
};

export default SelectListBox;
