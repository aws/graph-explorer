import { css } from "@emotion/css";
import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import { withClassNamePrefix } from "../../../core";
import { useDeepMemo } from "../../../hooks";
import type { ColumnInstance } from "react-table";

import Select from "../../Select/Select";

const defaultStyles = (pfx: string, isDarkTheme?: boolean) => css`
  width: 100%;

  .${pfx}-menu-root {
    button {
      ${!isDarkTheme && `background-color: var(--palette-background-default)`}
    }
  }
`;

// TODO - activeTheme is passed to avoid call hook inside a hook
//      - error in react lifecycle. However, we need to review
//      - how to use hooks inside a filter component in react-tables
export const SingleSelectFilter = <T extends object>(
  activeTheme?: ActiveThemeType<ProcessedTheme>
  // eslint-disable-next-line react/display-name
) => ({ column }: { column: ColumnInstance<T> }) => {
  const { setFilter, preFilteredRows, id } = column;
  // TODO - above scenario
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const options: string[] = useDeepMemo(() => {
    const options = new Set();
    preFilteredRows.forEach(row => {
      options.add(row.values[id]);
    });
    return ([...Array.from(options.values())] as string[]).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [id, preFilteredRows]);

  // TODO - above scenario
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mergedOptions = useDeepMemo(
    () => [
      { label: "All", value: "all" },
      ...options.map(option => ({ label: option, value: option })),
    ],
    [options]
  );

  const pfx = withClassNamePrefix("filter-type-select");
  return (
    <div
      className={defaultStyles("filter-type-select", activeTheme?.isDarkTheme)}
    >
      <Select
        aria-label={`filter select for ${id}`}
        size="sm"
        noMargin
        hideError
        className={pfx("menu-root")}
        value={column.filterValue || "all"}
        onChange={option =>
          option === "all" ? setFilter(undefined) : setFilter(option)
        }
        options={mergedOptions}
      />
    </div>
  );
};

export default SingleSelectFilter;
