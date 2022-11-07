import { css } from "@emotion/css";

import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import { withClassNamePrefix } from "../../../core";
import type { ColumnInstance } from "react-table";

import type { DatePickerProps } from "../../DatePicker";
import DatePickerInput from "../../DatePickerInput";

const defaultStyles = () => css`
  width: 100%;
`;

const datePickerStyles = (pfx: string, isDarkTheme?: boolean) => css`
  .${pfx}-button {
    background: transparent;
    border: none;
    color: inherit;
    height: 26px;
    font-size: 0.85rem;
  }

  .${pfx}-input {
    max-width: 100%;
  }
  .${pfx}-input:not(:hover) {
    ${!isDarkTheme &&
    `background-color: var(--palette-background-default); !important`}
  }
`;

export const DateFilter = (activeTheme?: ActiveThemeType<ProcessedTheme>) => (
  mode: DatePickerProps["mode"] = "calendar"
) => {
  // eslint-disable-next-line react/display-name
  return <T extends object>({ column }: { column: ColumnInstance<T> }) => {
    const { filterValue, setFilter } = column;
    const pfx = withClassNamePrefix("filter-type-date");
    return (
      <div className={defaultStyles()}>
        <DatePickerInput
          aria-label={`filter date to ${column.id}`}
          classNamePrefix={pfx("picker")}
          className={datePickerStyles(pfx("picker"), activeTheme?.isDarkTheme)}
          mode={mode}
          noMargin
          hideError
          value={
            filterValue
              ? mode === "calendar"
                ? new Date(filterValue)
                : {
                    startDate: new Date(filterValue.startDate),
                    endDate: new Date(filterValue.endDate),
                  }
              : undefined
          }
          direction="vertical"
          size="sm"
          dateFormat="MMM dd yyyy"
          clearable={true}
          onChange={value => {
            if (!value) {
              setFilter(undefined);
              return;
            }

            if (value instanceof Date) {
              setFilter(value.toISOString());
              return;
            }

            setFilter({
              startDate: value.startDate?.toISOString(),
              endDate: value.endDate?.toISOString(),
            });
          }}
        />
      </div>
    );
  };
};

export default DateFilter;
