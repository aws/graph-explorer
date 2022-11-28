import { cx } from "@emotion/css";
import type { ListProps } from "@react-stately/list";
import type { MultipleSelection } from "@react-types/shared/src/selection";
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { mergeRefs, useLayer } from "react-laag";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import IconButton from "../../IconButton";
import { ChevronDownIcon } from "../../icons";
import CloseIcon from "../../icons/CloseIcon";
import type { SelectOption, SelectProps } from "../Select";
import styles from "../Select.styles";
import SelectListBox from "./SelectListBox";
import SelectPopover from "./SelectPopover";

export { Item, Section } from "@react-stately/collections";

type SelectBoxProps<T> = ListProps<T> &
  Omit<SelectProps, "options" | "value" | "onChange"> & {
    items: Array<SelectOption>;
  };

const SelectBox = (
  { onSelectionChange, ...props }: SelectBoxProps<SelectOption>,
  ref: ForwardedRef<HTMLButtonElement>
) => {
  const {
    label,
    isDisabled,
    isReadOnly,
    labelPlacement = "top",
    classNamePrefix = "ft",
    size = "md",
    validationState,
    hideError,
    noMargin,
    className,
    errorMessage,
    variant = "default",
    clearable,
    menuStyleOverride,
    menuWidth,
    items,
  } = props;
  const styleWithTheme = useWithTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const { triggerProps, layerProps, renderLayer, triggerBounds } = useLayer({
    isOpen: items.length > 0 && menuOpen,
    auto: true,
    placement: "bottom-start",
    possiblePlacements: ["bottom-start", "top-start", "bottom-end", "top-end"],
    triggerOffset: 6,
    onOutsideClick: () => setMenuOpen(false),
    onDisappear: () => setMenuOpen(false),
    onParentClose: () => setMenuOpen(false),
  });

  const close = useCallback(() => {
    setMenuOpen(false);
  }, [setMenuOpen]);

  const pfx = withClassNamePrefix(classNamePrefix);

  const selectedOptions = useMemo(() => {
    if (!props.selectedKeys) {
      return "";
    }

    if (props.selectedKeys === "all") {
      return "All";
    }
    const selection = [...props.selectedKeys];

    if (props.selectionMode === "single" && props.selectedKeys !== "all") {
      const selectedValue = selection.length ? selection[0] : undefined;
      const item = props.items.find(item => item.value === selectedValue);
      if (!item) {
        return "";
      }
      return selectedValue !== undefined
        ? item.render
          ? item.render(item)
          : item.label ?? ""
        : "";
    }

    const selectedValues = selection.map(selectedValue => {
      const item = props.items.find(item => item.value === selectedValue);
      if (!item) {
        return "";
      }
      return selectedValue !== undefined
        ? item.render
          ? item.render(item)
          : item.label ?? ""
        : "";
    });
    if (!selectedValues.length) {
      return "";
    }

    return selectedValues.every(val => typeof val === "string") ? (
      selectedValues.join(", ")
    ) : (
      <div className={styleWithTheme(styles.multipleSelectedValuesWrapper)}>
        {selectedValues}
      </div>
    );
  }, [props.selectedKeys, props.selectionMode, props.items, styleWithTheme]);

  const handleChange: MultipleSelection["onSelectionChange"] = useCallback(
    value => {
      if (props.selectionMode === "single") {
        const selection = [...value];
        if (selection.length === 0 && !props.allowDeselect) {
          close();
          return;
        }

        onSelectionChange?.(value);
        close();
        return;
      }

      onSelectionChange?.(value);
    },
    [props.selectionMode, props.allowDeselect, onSelectionChange, close]
  );

  return (
    <div
      className={cx(
        styleWithTheme(
          styles.selectContainerStyles({
            labelPlacement,
            classNamePrefix,
            size,
            validationState,
            hideError,
            noMargin,
            variant,
            clearable,
          })
        ),
        pfx(`select-label-${labelPlacement}`),
        pfx(`select-variant-${variant}`),
        pfx(`select-size-${size}`),
        pfx(`select-${validationState || "valid"}`),
        {
          [pfx("select-disabled")]: isDisabled,
          [pfx("select-readonly")]: isReadOnly,
        },
        className
      )}
      onClick={() => {
        if (isDisabled) return;
        items.length > 0 && setMenuOpen(!menuOpen);
      }}
    >
      {label && <label className={pfx("input-label")}>{label}</label>}
      <div className={pfx("input-container")} aria-label={props["aria-label"]}>
        <button
          ref={mergeRefs(triggerProps.ref, ref)}
          type="button"
          className={cx(pfx("select"), {
            [pfx("no-options")]: items.length < 1,
            [pfx("option-selected")]: selectedOptions !== "",
          })}
        >
          {selectedOptions !== "" ? (
            <span className={pfx("selection")}>{selectedOptions}</span>
          ) : (
            <span className={pfx("placeholder")}>
              {props.placeholder || "Select an option..."}
            </span>
          )}
          <span className={pfx("dropdown-indicator")}>
            {clearable && selectedOptions !== "" && (
              <IconButton
                className={pfx("clear-button")}
                as="span"
                variant="text"
                icon={<CloseIcon />}
                onPress={() => onSelectionChange?.(new Set())}
              />
            )}
            {items.length > 0 && (
              <ChevronDownIcon
                style={{ width: 18, height: 18 }}
                aria-hidden="true"
              />
            )}
          </span>
        </button>
        {validationState === "invalid" && !!errorMessage && !hideError && (
          <div className={pfx("input-error")}>{errorMessage}</div>
        )}
      </div>
      {items.length > 0 &&
        menuOpen &&
        renderLayer(
          <SelectPopover
            menuStyleOverride={menuStyleOverride}
            isOpen={menuOpen}
            {...layerProps}
            style={{
              ...layerProps.style,
              width: menuWidth || triggerBounds?.width,
            }}
            onClose={close}
          >
            <SelectListBox {...props} onSelectionChange={handleChange} />
          </SelectPopover>
        )}
    </div>
  );
};

export default forwardRef<HTMLButtonElement, SelectBoxProps<SelectOption>>(
  SelectBox
);
