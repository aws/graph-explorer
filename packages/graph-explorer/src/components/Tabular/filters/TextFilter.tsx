import { css } from "@emotion/css";
import { ReactNode } from "react";
import { ColumnInstance } from "react-table";

import type { ActiveThemeType, ProcessedTheme } from "@/core";
import { cssVar } from "@/core/ThemeProvider/utils/lib";

import { FilterIcon } from "@/components/icons";
import Input from "@/components/Input";

const defaultStyles = (isDarkTheme?: boolean) => css`
  width: 100%;
  .input-root {
    .input {
      margin: 0;
      width: 100%;
      box-sizing: border-box;
      ${!isDarkTheme && "background-color: var(--palette-background-default)"};
    }
  }

  .input-container .start-adornment {
    display: flex;
    align-items: center;
    color: ${cssVar("--forms-input-color", "--palette-text-disabled", "black")};
    font-size: 14px;
  }
`;

export type TextFilterProps = {
  placeholder?: string;
  startAdornment?: ReactNode;
};

export const TextFilter =
  <T extends object>(activeTheme?: ActiveThemeType<ProcessedTheme>) =>
  ({ placeholder, startAdornment }: TextFilterProps) => {
    return ({ column }: { column: ColumnInstance<T> }) => {
      return (
        <div className={defaultStyles(activeTheme?.isDarkTheme)}>
          <Input
            aria-label={`filter by ${column.id}`}
            className={"input-root"}
            type={"text"}
            size="sm"
            noMargin
            hideError
            placeholder={placeholder || "Filter..."}
            value={column.filterValue || ""}
            onChange={value => {
              // do not use value || undefined because
              // if the user types zero, it clears the filter too
              value !== "" && value !== undefined
                ? column.setFilter(value)
                : column.setFilter(undefined);
            }}
            startAdornment={
              <div className={"start-adornment"}>
                {startAdornment || <FilterIcon />}
              </div>
            }
          />
        </div>
      );
    };
  };

export default TextFilter;
