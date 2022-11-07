import { cx } from "@emotion/css";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { formatDate } from "../../utils";
import {
  OverlayContainer,
  useOverlayPosition,
  useOverlayTrigger,
} from "@react-aria/overlays";
import { useOverlayTriggerState } from "@react-stately/overlays";
import isDate from "date-fns/isDate";
import isPlainObject from "lodash/isPlainObject";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { mergeRefs } from "react-laag";

import type { DatePickerProps } from "../DatePicker";
import DatePicker from "../DatePicker/DatePicker";
import IconButton from "../IconButton";
import { CloseIcon, DateRangeIcon } from "../icons";
import type { BaseInputProps } from "../Input/Input";
import Input from "../Input/Input";
import styles from "./DatePickerInput.styles";
import DatePickerPopover from "./components/DatePickerPopover";

export interface DatePickerInputProps
  extends Omit<
      BaseInputProps,
      "value" | "onChange" | "component" | "startAdornment" | "endAdornment"
    >,
    Pick<
      DatePickerProps,
      "onChange" | "dateFormat" | "monthsShown" | "direction"
    > {
  value?: DatePickerProps["date"] | DatePickerProps["dates"];
  name?: string;
  clearable?: boolean;
  mode?: DatePickerProps["mode"];
  portalContainer?: HTMLElement;
}

// eslint-disable-next-line react/display-name
const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      mode = "calendar",
      monthsShown,
      dateFormat = "MM/dd/yyyy",
      direction,
      className,
      classNamePrefix = "ft",
      clearable,
      portalContainer,
      ...props
    },
    ref
  ) => {
    const [formattedValue, setFormattedValue] = useState<string>("");
    const state = useOverlayTriggerState({});
    const triggerRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef(null);
    const { triggerProps, overlayProps } = useOverlayTrigger(
      { type: "dialog" },
      state,
      triggerRef
    );

    // Get popover positioning props relative to the trigger
    const { overlayProps: positionProps } = useOverlayPosition({
      targetRef: triggerRef,
      overlayRef,
      placement: "top",
      offset: 5,
      isOpen: state.isOpen,
    });

    const pfx = withClassNamePrefix(classNamePrefix);

    useEffect(() => {
      if (!value) {
        setFormattedValue("");
        return;
      }
      if (mode === "calendar" && isDate(value)) {
        setFormattedValue(
          formatDate(value as Date, dateFormat || "MM/dd/yyyy")
        );
        return;
      }

      if (!isPlainObject(value)) {
        return;
      }

      const rangeValue = value as { startDate?: Date; endDate?: Date };
      const dates = [];
      if (rangeValue.startDate) {
        dates[0] = formatDate(rangeValue.startDate, dateFormat || "MM/dd/yyyy");
      }
      if (rangeValue.endDate) {
        dates[1] = formatDate(rangeValue.endDate, dateFormat || "MM/dd/yyyy");
      }

      if (dates.length) {
        setFormattedValue(dates.join(" - "));
        return;
      }

      setFormattedValue("");
    }, [value, mode, dateFormat]);

    useImperativeHandle(
      () => triggerRef,
      () => null,
      []
    );

    const handleChange = (
      value:
        | {
            startDate?: Date;
            endDate?: Date;
          }
        | Date
        | null
        | undefined
    ) => {
      if (value instanceof Date) {
        state.close();
      }
      onChange(value);
    };

    const hasValue =
      mode === "calendar"
        ? Boolean(value)
        : Boolean(
            (value as DatePickerProps["dates"])?.startDate ||
              (value as DatePickerProps["dates"])?.endDate
          );

    const styleWithTheme = useWithTheme();
    return (
      <div
        className={cx(
          styleWithTheme(styles.dateInputStyles(classNamePrefix || "ft")),
          { [pfx("datepickerInput-input-disabled")]: props.isDisabled },
          className
        )}
      >
        <Input
          {...props}
          autocomplete="off"
          classNamePrefix={classNamePrefix}
          className={pfx("datepickerInput-input")}
          value={formattedValue}
          {...triggerProps}
          ref={mergeRefs(triggerRef, ref)}
          placeholder={
            placeholder
              ? placeholder
              : mode === "calendar"
              ? dateFormat?.toUpperCase()
              : `${dateFormat?.toUpperCase()} - ${dateFormat?.toUpperCase()}`
          }
          endAdornment={
            <>
              {hasValue && clearable && (
                <IconButton
                  isDisabled={props.isDisabled}
                  aria-label="clear"
                  className={cx(
                    styles.inputCalendar,
                    pfx("datepickerInput-clear-button")
                  )}
                  onPress={() => onChange(undefined)}
                  icon={<CloseIcon />}
                  variant="text"
                />
              )}
              <IconButton
                isDisabled={props.isDisabled}
                aria-label="open calendar"
                className={cx(
                  styles.inputCalendar,
                  pfx("datepickerInput-calendar-button")
                )}
                onPress={() => state.toggle()}
                icon={<DateRangeIcon />}
                variant="text"
              />
            </>
          }
          onClick={() => state.toggle()}
        />
        {state.isOpen && (
          <OverlayContainer portalContainer={portalContainer}>
            <DatePickerPopover
              {...overlayProps}
              {...positionProps}
              ref={overlayRef}
              isOpen={state.isOpen}
              onClose={state.close}
            >
              <DatePicker
                monthsShown={monthsShown}
                mode={mode}
                direction={direction}
                dates={
                  mode !== "calendar"
                    ? (value as { startDate?: Date; endDate?: Date })
                    : undefined
                }
                date={mode === "calendar" ? (value as Date) : undefined}
                className={styles.pickerStyles}
                onChange={handleChange}
                customButton
                inline
              />
            </DatePickerPopover>
          </OverlayContainer>
        )}
      </div>
    );
  }
);

export default DatePickerInput;
