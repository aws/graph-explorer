import { cx } from "@emotion/css";
import {
  lighten,
  useTheme,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { MantineProvider } from "@mantine/core";
import { Calendar, RangeCalendar } from "@mantine/dates";
import type { CalendarProps, RangeCalendarProps } from "@mantine/dates";
import { ReactNode, useMemo, useState } from "react";

import IconButton from "../IconButton";
import { CloseIcon } from "../icons";
import UseLayer from "../UseLayer/UseLayer";
import UseLayerOverlay from "../UseLayer/UseLayerOverlay";
import UseLayerTrigger from "../UseLayer/UseLayerTrigger";
import type { DateRangeSelection } from "./components/DatePickerButton/DatePickerButton";
import DatePickerButton from "./components/DatePickerButton/DatePickerButton";
import styles from "./DatePicker.styles";

/* TODO refactor component to use the new theming mechanism */
export interface DatePickerProps {
  /**
   * @deprecated it's not longer used
   * DatePicker DOM ID
   */
  id?: string;
  /**
   * DatePicker mode to render
   */
  mode: "calendar" | "range";
  /**
   * DatePicker format to display
   */
  dateFormat?: string;
  /**
   * DatePicker className prefix
   */
  classNamePrefix?: string;
  /**
   * DatePicker format
   */
  className?: string;
  /**
   * DatePicker rendered month count
   */
  monthsShown?: number;
  /**
   * DatePicker direction of calendar months
   */
  direction?: "horizontal" | "vertical";
  /**
   * DatePicker value
   */
  date?: Date;
  /**
   * DatePicker start and end range
   */
  dates?: DateRangeSelection;
  buttonVariant?: "filled" | "text" | "default";
  /**
   * Callback that fires when DatePicker dates are updated
   */
  onChange: (
    value:
      | {
          startDate?: Date;
          endDate?: Date;
        }
      | Date
      | null
      | undefined
  ) => void;
  /**
   * Whether to render custom button UI
   */
  customButton?: boolean;
  startAdornment?: ReactNode;
  /**
   * Whether to disbale the button UI
   */
  disabled?: boolean;
  /**
   * Allows to clear the Input field
   */
  clearable?: boolean;
  /**
   * Show the Picker as an inline calendar instead of a Popup
   */
  inline?: boolean;
}

export const DatePicker = ({
  classNamePrefix = "ft",
  className = "",
  monthsShown = 1,
  buttonVariant = "filled",
  date = undefined,
  dates = {
    startDate: undefined,
    endDate: undefined,
  },
  mode = "calendar",
  onChange,
  customButton = false,
  dateFormat = "MM/dd/yyyy",
  startAdornment,
  disabled = false,
  clearable = false,
  inline = false,
}: DatePickerProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const themedStyles = useWithTheme();
  const [visible, setVisible] = useState(false);
  const [theme] = useTheme();
  const dateValue = useMemo(() => {
    if (mode === "range") {
      return [dates.startDate ?? null, dates.endDate ?? null];
    }

    return date;
  }, [date, dates.endDate, dates.startDate, mode]);

  const hasValue = useMemo(
    () =>
      mode === "calendar"
        ? Boolean(date)
        : Boolean(dates.startDate || dates.endDate),
    [date, dates.endDate, dates.startDate, mode]
  );

  const pickerButton = (
    <div className={cx(styles.defaultStyles(classNamePrefix), className)}>
      {startAdornment && (
        <div className={pfx("adornment")}>{startAdornment}</div>
      )}
      {customButton ? null : (
        <DatePickerButton
          mode={mode}
          buttonVariant={buttonVariant}
          state={mode === "calendar" ? date : dates}
          dateFormat={dateFormat}
          classNamePrefix={classNamePrefix}
          disabled={disabled}
          className={className}
          onClick={() =>
            setVisible(previousVisibleState => !previousVisibleState)
          }
        />
      )}
      {clearable && hasValue && (
        <div className={pfx("adornment")}>
          <IconButton
            variant={"text"}
            size={"small"}
            icon={<CloseIcon />}
            onPress={() => onChange(undefined)}
          />
        </div>
      )}
    </div>
  );

  const picker = (
    <MantineProvider
      theme={{
        // Theme is deeply merged with default theme
        colorScheme: theme.isDarkTheme ? "dark" : "light",
        primaryShade: {
          light: 2,
          dark: 2,
        },
        colors: {
          blue: [
            lighten(theme.theme.palette.primary.light, 0.3),
            theme.theme.palette.primary.light,
            theme.theme.palette.primary.main,
            theme.theme.palette.primary.dark,
            theme.theme.palette.primary.dark,
            theme.theme.palette.primary.dark,
            theme.theme.palette.primary.dark,
            theme.theme.palette.primary.dark,
            theme.theme.palette.primary.dark,
          ],
        },
        shadows: theme.theme.shadow,
        fontFamily: theme.theme.typography.fontFamily,
      }}
    >
      <div className={themedStyles(styles.calendarStyles(classNamePrefix))}>
        {mode === "range" ? (
          <RangeCalendar
            amountOfMonths={monthsShown}
            onChange={value => {
              onChange({
                startDate: value[0] ?? undefined,
                endDate: value[1] ?? undefined,
              });
            }}
            value={dateValue as RangeCalendarProps["value"]}
          />
        ) : (
          <Calendar
            amountOfMonths={monthsShown}
            value={date}
            onChange={value => onChange(value as CalendarProps["value"])}
          />
        )}
      </div>
    </MantineProvider>
  );

  if (inline) {
    return (
      <>
        {pickerButton}
        {picker}
      </>
    );
  }

  return (
    <UseLayer
      isOpen={visible || customButton}
      overflowContainer={true}
      auto={true}
      placement={"bottom-start"}
      triggerOffset={8}
      onOutsideClick={() => setVisible(false)}
    >
      <UseLayerTrigger>{pickerButton}</UseLayerTrigger>
      <UseLayerOverlay>{picker}</UseLayerOverlay>
    </UseLayer>
  );
};

export default DatePicker;
