import { memo } from "react";
import { withClassNamePrefix } from "../../../core";
import SearchIcon from "../../icons/SearchIcon";
import Input from "../../Input";
import type { SelectOption } from "../../Select";
import Select from "../../Select";

type SearchBarProps = {
  types: SelectOption[];
  search?: string;
  searchPlaceholder?: string;
  classNamePrefix?: string;
  onSearch: (search: string) => void;
  type: string;
  onTypeChange?: (type: string) => void;
};

const SearchBar = ({
  types,
  search,
  searchPlaceholder,
  onSearch,
  onTypeChange,
  type,
  classNamePrefix,
}: SearchBarProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <>
      <Input
        className={pfx("advanced-list-search-input")}
        value={search}
        aria-label="Search available items"
        onChange={onSearch}
        noMargin
        size="sm"
        hideError
        placeholder={searchPlaceholder || "Search for items"}
        startAdornment={<SearchIcon />}
      />
      {!!types.length && onTypeChange && (
        <Select
          aria-label="select category"
          className={pfx("advanced-list-category-select")}
          options={types}
          value={type}
          onChange={value => onTypeChange?.(value as string)}
          noMargin
          size="sm"
          hideError
        />
      )}
    </>
  );
};

export default memo(SearchBar);
