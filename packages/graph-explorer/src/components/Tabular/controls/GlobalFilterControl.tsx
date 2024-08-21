import { css } from "@emotion/css";
import { FunctionComponent } from "react";
import { useIsDarkTheme } from "@/core";
import { cssVar } from "@/core/ThemeProvider/utils/lib";

import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/Input/Input";
import { useTabularControl } from "../TabularControlsProvider";

const defaultStyles = (isDarkTheme: boolean) => css`
  display: flex;
  align-items: center;

  .input-root {
    width: 100%;
    margin: 0;
    .input {
      margin: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .input:not(:hover):not(:focus):not(:active) {
      ${!isDarkTheme && `background-color: var(--palette-background-default);`}
    }

    .start-adornment {
      color: ${cssVar(
        "--forms-input-color",
        "--palette-text-disabled",
        "black"
      )};
      font-size: 14px;
    }
  }
`;

export const GlobalFilterControl: FunctionComponent = () => {
  const { instance } = useTabularControl();
  const isDarkTheme = useIsDarkTheme();
  return (
    <div className={defaultStyles(isDarkTheme)}>
      <Input
        aria-label={"global filter"}
        className={"global-filter-input-root"}
        type={"text"}
        noMargin
        hideError
        size="sm"
        placeholder={"Search..."}
        value={(instance?.globalFilter as string) || ""}
        onChange={value => {
          // do not use value || undefined because
          // if the user types zero, it clears the filter too
          value !== "" && value !== undefined
            ? instance?.setGlobalFilter(value)
            : instance?.setGlobalFilter(undefined);
        }}
        startAdornment={
          <div className={"global-filter-start-adornment"}>
            <SearchIcon />
          </div>
        }
      />
    </div>
  );
};

export default GlobalFilterControl;
