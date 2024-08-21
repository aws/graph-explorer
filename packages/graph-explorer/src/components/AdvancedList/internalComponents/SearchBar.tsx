import { memo } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import Input from "@/components/Input";
import type { SelectOption } from "@/components/Select";
import Select from "@/components/Select";

type SearchBarProps = {
  types: SelectOption[];
  search?: string;
  searchPlaceholder?: string;
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
}: SearchBarProps) => {
  return (
    <>
      <Input
        className={"advanced-list-search-input"}
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
          className={"advanced-list-category-select"}
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
