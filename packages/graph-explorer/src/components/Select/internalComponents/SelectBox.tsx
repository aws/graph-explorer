import { cn } from "@/utils";
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
import { useWithTheme } from "@/core";
import { IconButton } from "@/components";
import { ChevronDownIcon } from "@/components/icons";
import CloseIcon from "@/components/icons/CloseIcon";
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
          : (item.label ?? "")
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
          : (item.label ?? "")
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
    (value: any) => {
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
      className={cn(
        styleWithTheme(
          styles.selectContainerStyles({
            labelPlacement,
            size,
            validationState,
            hideError,
            noMargin,
            variant,
            clearable,
          })
        ),
        `select-label-${labelPlacement}`,
        `select-variant-${variant}`,
        `select-size-${size}`,
        `select-${validationState || "valid"}`,
        {
          ["select-disabled"]: isDisabled,
          ["select-readonly"]: isReadOnly,
        },
        className
      )}
      onClick={() => {
        if (isDisabled) return;
        items.length > 0 && setMenuOpen(!menuOpen);
      }}
    >
      {label && <label className={"input-label"}>{label}</label>}
      <div className={"input-container"} aria-label={props["aria-label"]}>
        <button
          ref={mergeRefs(triggerProps.ref, ref)}
          type="button"
          className={cn("select", {
            ["no-options"]: items.length < 1,
            ["option-selected"]: selectedOptions !== "",
          })}
        >
          {selectedOptions !== "" ? (
            <span className={"selection"}>{selectedOptions}</span>
          ) : (
            <span className={"placeholder"}>
              {props.placeholder || "Select an option..."}
            </span>
          )}
          <span className={"dropdown-indicator"}>
            {clearable && selectedOptions !== "" && (
              <IconButton
                className={"clear-button"}
                variant="text"
                icon={<CloseIcon />}
                onClick={() => onSelectionChange?.(new Set())}
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
          <div className={"input-error"}>{errorMessage}</div>
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
