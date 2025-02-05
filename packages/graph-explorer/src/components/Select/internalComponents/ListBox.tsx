import { cn } from "@/utils";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import { useListBox, useOption } from "@react-aria/listbox";
import type { ListState } from "@react-stately/list";
import type { Node } from "@react-types/shared";
import type { ForwardedRef, RefObject } from "react";
import { forwardRef, useRef } from "react";
import ListItem from "@/components/ListItem";
import { CheckIcon } from "lucide-react";

interface OptionProps<T> {
  item: Node<T>;
  state: ListState<T>;
}

interface ListBoxProps<T> extends AriaListBoxOptions<T> {
  state: ListState<T>;
}

const ListBox = forwardRef(
  <T,>(props: ListBoxProps<T>, ref: ForwardedRef<HTMLUListElement | null>) => {
    const { state } = props;

    const { listBoxProps } = useListBox(
      props,
      state,
      ref as RefObject<HTMLUListElement>
    );

    return (
      <ul
        className={cn(
          "max-h-[300px] list-none overflow-auto p-0 p-1 outline-none"
        )}
        {...listBoxProps}
        ref={ref}
      >
        {[...state.collection].map(item => (
          <OptionItem key={item.key} item={item} state={state} />
        ))}
      </ul>
    );
  }
);

const OptionItem = <T,>({ item, state }: OptionProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);

  const itemDisabled = state.disabledKeys.has(item.key);

  const { optionProps, isSelected, isDisabled } = useOption(
    {
      isDisabled: itemDisabled,
      key: item.key,
      shouldFocusOnHover: true,
    },
    state,
    ref
  );

  return (
    <ListItem
      ref={ref}
      className={cn(
        "focus:bg-background-secondary flex flex-row justify-between outline-none",
        isDisabled && "pointer-events-none opacity-50"
      )}
      {...optionProps}
    >
      {item.rendered}
      {isSelected ? <CheckIcon className="text-text-primary size-5" /> : null}
    </ListItem>
  );
};

export default ListBox;
