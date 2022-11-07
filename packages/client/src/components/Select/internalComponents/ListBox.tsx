import { cx } from "@emotion/css";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import { useListBox, useOption } from "@react-aria/listbox";
import type { ListState } from "@react-stately/list";
import type { Node } from "@react-types/shared";
import type { ForwardedRef, RefObject } from "react";
import { forwardRef, useRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "../Select.styles";

interface OptionProps<T> {
  item: Node<T>;
  state: ListState<T>;
  classNamePrefix?: string;
}

interface ListBoxProps<T> extends AriaListBoxOptions<T> {
  state: ListState<T>;
  classNamePrefix?: string;
}

// eslint-disable-next-line react/display-name
const ListBox = forwardRef(
  <T,>(props: ListBoxProps<T>, ref: ForwardedRef<HTMLUListElement | null>) => {
    const { state } = props;

    const styleWithTheme = useWithTheme();

    const { listBoxProps } = useListBox(
      props,
      state,
      ref as RefObject<HTMLUListElement>
    );

    return (
      <ul
        className={styleWithTheme(styles.listStyles)}
        {...listBoxProps}
        ref={ref}
      >
        {[...state.collection].map(item => (
          <OptionItem
            key={item.key}
            classNamePrefix={props.classNamePrefix}
            item={item}
            state={state}
          />
        ))}
      </ul>
    );
  }
);

const OptionItem = <T,>({
  item,
  state,
  classNamePrefix = "ft",
}: OptionProps<T>) => {
  const ref = useRef<HTMLLIElement>(null);

  const itemDisabled = state.disabledKeys.has(item.key);
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const { optionProps, isSelected, isFocused, isDisabled } = useOption(
    {
      isDisabled: itemDisabled,
      key: item.key,
      shouldFocusOnHover: true,
    },
    state,
    ref
  );

  return (
    <li
      className={cx(
        styleWithTheme(styles.listItemStyles(classNamePrefix)),
        pfx("select-list-item-wrapper"),
        {
          [pfx("select-list-item-disabled")]: isDisabled,
          [pfx("select-list-item-selected")]: isSelected,
          [pfx("select-list-item-focused")]: isFocused,
        }
      )}
      {...optionProps}
      ref={ref}
    >
      <div
        className={cx(
          styleWithTheme(styles.itemStyles),
          pfx("select-list-item")
        )}
      >
        {item.rendered}
      </div>
    </li>
  );
};

export default ListBox;
