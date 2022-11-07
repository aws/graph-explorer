import { cx } from "@emotion/css";
import { useComboBox } from "@react-aria/combobox";
import { useSearchField } from "@react-aria/searchfield";
import { useComboBoxState } from "@react-stately/combobox";
import { useSearchFieldState } from "@react-stately/searchfield";
import type { ComboBoxProps } from "@react-types/combobox";
import type { CSSProperties, ReactNode, Ref, RefObject } from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useLayer } from "react-laag";
import { useWithTheme, withClassNamePrefix } from "../../core";
import IconButton from "../IconButton";
import CloseIcon from "../icons/CloseIcon";
import Input from "../Input";
import type { SelectOption } from "../Select";
import ListBox from "../Select/internalComponents/ListBox";
import SelectPopover from "../Select/internalComponents/SelectPopover";
import styles from "./Autocomplete.styles";

export interface AutocompleteBoxProps<T> extends ComboBoxProps<T> {
  ["aria-label"]?: string;
  label?: string;
  labelPlacement?: "top" | "left" | "inner";
  className?: string;
  classNamePrefix?: string;
  errorMessage?: string;
  hideError?: boolean;
  size?: "sm" | "md";
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  noMargin?: boolean;
  minWidth?: number;
  menuStyleOverride?: CSSProperties;
  openOnFocus?: boolean;
  clearable?: boolean;
}

const AutocompleteBox = (
  {
    className,
    classNamePrefix = "pfx",
    minWidth,
    menuStyleOverride,
    openOnFocus = false,
    clearable = true,
    ...props
  }: AutocompleteBoxProps<SelectOption>,
  ref: Ref<HTMLInputElement | null>
) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  // Setup filter function and state.
  const state = useComboBoxState({
    ...props,
    selectedKey: props.selectedKey,
    onSelectionChange: props.onSelectionChange,
  });

  // Setup refs and get props for child elements.
  // const ref = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listBoxRef = useRef(null);
  const popoverRef = useRef(null);
  const clearButtonRef = useRef(null);

  useImperativeHandle(ref, () => inputRef.current);
  const { triggerProps, layerProps, renderLayer, triggerBounds } = useLayer({
    isOpen: state.isOpen,
    auto: true,
    placement: "bottom-start",
    possiblePlacements: ["bottom-start", "top-start", "bottom-end", "top-end"],
    triggerOffset: 1,
    onOutsideClick: state.close,
    onDisappear: state.close,
    onParentClose: state.close,
  });

  const { inputProps, listBoxProps } = useComboBox(
    {
      ...props,
      // Force options list to open onfocus Input.
      onFocus: () => openOnFocus && state.open(),
      inputRef: inputRef as React.MutableRefObject<HTMLInputElement>,
      listBoxRef,
      popoverRef,
    },
    state
  );

  // Get props for the clear button from useSearchField
  const searchProps = {
    ...props,
    value: state.inputValue,
    onChange: (v: string) => state.setInputValue(v),
  };
  const searchState = useSearchFieldState(searchProps);
  const { clearButtonProps } = useSearchField(
    searchProps,
    searchState,
    inputRef as RefObject<HTMLInputElement>
  );

  const showMenu = state.isOpen;
  return (
    <div
      className={cx(
        styleWithTheme(styles.autocompleteBoxStyles(classNamePrefix)),
        pfx("autocomplete-box"),
        className
      )}
    >
      <span {...triggerProps}>
        <Input
          overrideInputProps={inputProps}
          ref={inputRef}
          {...props}
          clearButton={
            clearable && (
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <IconButton
                isDisabled={props.isDisabled}
                {...clearButtonProps}
                ref={clearButtonRef}
                className={
                  state.inputValue ? undefined : pfx("clear-button-hidden")
                }
                size="small"
                variant="text"
                icon={<CloseIcon />}
              />
            )
          }
        />
      </span>
      {showMenu &&
        renderLayer(
          <div {...layerProps} style={{ ...layerProps.style, zIndex: 9999 }}>
            <SelectPopover
              ref={popoverRef}
              menuStyleOverride={menuStyleOverride}
              onClose={state.close}
              style={{
                ...layerProps.style,
                width: minWidth || triggerBounds?.width,
              }}
            >
              <ListBox {...listBoxProps} state={state} ref={listBoxRef} />
            </SelectPopover>
          </div>
        )}
    </div>
  );
};

export default forwardRef<
  HTMLInputElement | null,
  AutocompleteBoxProps<SelectOption>
>(AutocompleteBox);
