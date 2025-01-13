/* eslint-disable react-compiler/react-compiler */
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
import { useLayer } from "react-laag";
import { useWithTheme } from "@/core";
import type { SelectOption, SelectProps } from "../Select";
import styles from "../Select.styles";
import SelectListBox from "./SelectListBox";
import SelectPopover from "./SelectPopover";
import {
  Select as NewSelect,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Label,
} from "@/components/radix";

export { Item, Section } from "@react-stately/collections";

type SelectBoxProps<T> = ListProps<T> &
  Omit<SelectProps, "options" | "value" | "onChange"> & {
    items: Array<SelectOption>;
  };

const SelectBox = ({
  onSelectionChange,
  ...props
}: SelectBoxProps<SelectOption>) => {
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
    items,
  } = props;
  const styleWithTheme = useWithTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  // const { triggerProps, layerProps, renderLayer, triggerBounds } = useLayer({
  //   isOpen: items.length > 0 && menuOpen,
  //   auto: true,
  //   placement: "bottom-start",
  //   possiblePlacements: ["bottom-start", "top-start", "bottom-end", "top-end"],
  //   triggerOffset: 6,
  //   onOutsideClick: () => setMenuOpen(false),
  //   onDisappear: () => setMenuOpen(false),
  //   onParentClose: () => setMenuOpen(false),
  // });

  // const close = useCallback(() => {
  //   setMenuOpen(false);
  // }, [setMenuOpen]);

  // const selectedOptions = useMemo(() => {
  //   if (!props.selectedKeys) {
  //     return "";
  //   }

  //   if (props.selectedKeys === "all") {
  //     return "All";
  //   }
  //   const selection = [...props.selectedKeys];

  //   if (props.selectedKeys !== "all") {
  //     const selectedValue = selection.length ? selection[0] : undefined;
  //     const item = props.items.find(item => item.value === selectedValue);
  //     if (!item) {
  //       return "";
  //     }
  //     return selectedValue !== undefined
  //       ? item.render
  //         ? item.render(item)
  //         : (item.label ?? "")
  //       : "";
  //   }

  //   const selectedValues = selection.map(selectedValue => {
  //     const item = props.items.find(item => item.value === selectedValue);
  //     if (!item) {
  //       return "";
  //     }
  //     return selectedValue !== undefined
  //       ? item.render
  //         ? item.render(item)
  //         : (item.label ?? "")
  //       : "";
  //   });
  //   if (!selectedValues.length) {
  //     return "";
  //   }

  //   return selectedValues.every(val => typeof val === "string") ? (
  //     selectedValues.join(", ")
  //   ) : (
  //     <div className={styleWithTheme(styles.multipleSelectedValuesWrapper)}>
  //       {selectedValues}
  //     </div>
  //   );
  // }, [props.selectedKeys, props.items, styleWithTheme]);

  // const handleChange: MultipleSelection["onSelectionChange"] = useCallback(
  //   (value: any) => {
  //     const selection = [...value];
  //     if (selection.length === 0) {
  //       close();
  //       return;
  //     }

  //     onSelectionChange?.(value);
  //     close();
  //   },
  //   [onSelectionChange, close]
  // );

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
      {/* {label && (
        <Label
          className={cn(
            labelPlacement === "inner" &&
              "absolute left-3 top-0.5 z-10 line-clamp-1 text-xs"
          )}
        >
          {label}
        </Label>
      )} */}
      <div className="input-container" aria-label={props["aria-label"]}>
        <NewSelect>
          <SelectTrigger
            className={
              labelPlacement === "inner"
                ? "flex h-auto flex-col items-start justify-start py-0"
                : ""
            }
          >
            <Label className="text-xs">{label}</Label>
            <SelectValue
              placeholder={props.placeholder || "Select an option..."}
            />
          </SelectTrigger>
          <SelectContent>
            {items.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </NewSelect>
        {/* <button
          ref={mergeRefs(triggerProps.ref, ref)}
          type="button"
          className={cn("select", {
            ["no-options"]: items.length < 1,
            ["option-selected"]: selectedOptions !== "",
          })}
        >
          {selectedOptions !== "" ? (
            <span className="selection">{selectedOptions}</span>
          ) : (
            <span className="placeholder">
              {props.placeholder || "Select an option..."}
            </span>
          )}
          <span className="dropdown-indicator">
            {items.length > 0 && (
              <ChevronDownIcon
                style={{ width: 18, height: 18 }}
                aria-hidden="true"
              />
            )}
          </span>
        </button> */}
        {validationState === "invalid" && !!errorMessage && !hideError && (
          <div className="input-error">{errorMessage}</div>
        )}
      </div>
      {/* {items.length > 0 &&
        menuOpen &&
        renderLayer(
          <SelectPopover
            isOpen={menuOpen}
            {...layerProps}
            style={{
              ...layerProps.style,
              width: triggerBounds?.width,
            }}
            onClose={close}
          >
            <SelectListBox {...props} onSelectionChange={handleChange} />
          </SelectPopover>
        )} */}
    </div>
  );
};

export default forwardRef<HTMLButtonElement, SelectBoxProps<SelectOption>>(
  SelectBox
);
