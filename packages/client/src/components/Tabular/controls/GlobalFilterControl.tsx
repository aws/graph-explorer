import { css } from "@emotion/css";
import { VFC } from "react";
import { useIsDarkTheme } from "../../../core";
import { cssVar } from "../../../core/ThemeProvider/utils/lib";

import { SearchIcon } from "../../icons";
import { Input } from "../../Input/Input";
import { useTabularControl } from "../TabularControlsProvider";

const defaultStyles = (pfx: string, isDarkTheme: boolean) => css`
  display: flex;
  align-items: center;

  .${pfx}-input-root {
    width: 100%;
    margin: 0;
    .${pfx}-input {
      margin: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .${pfx}-input:not(:hover):not(:focus):not(:active) {
      ${!isDarkTheme && `background-color: var(--palette-background-default);`}
    }

    .${pfx}-start-adornment {
      color: ${cssVar(
        "--forms-input-color",
        "--palette-text-disabled",
        "black"
      )};
      font-size: 14px;
    }
  }
`;

export const GlobalFilterControl: VFC = () => {
  const { instance } = useTabularControl();
  const isDarkTheme = useIsDarkTheme();
  return (
    <div className={defaultStyles("global-filter", isDarkTheme)}>
      <Input
        aria-label={"global filter"}
        classNamePrefix={"global-filter"}
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
