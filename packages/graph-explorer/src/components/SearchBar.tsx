import { useState } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import { Input } from "@/components";
import { cn } from "@/utils";
import { useDebounceValue } from "@/hooks";

type SearchBarProps = {
  search?: string;
  searchPlaceholder?: string;
  onSearch: (search: string) => void;
  className?: string;
};

export default function SearchBar({
  search,
  searchPlaceholder,
  onSearch,
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon className="text-text-secondary absolute top-[9px] left-4 size-5" />
      <Input
        value={search}
        onChange={event => onSearch(event.target.value)}
        placeholder={searchPlaceholder || "Search for items"}
        className="w-full rounded-full pl-10"
      />
    </div>
  );
}

export function useSearchItems<TItem>(
  items: TItem[],
  searchPredicate: (item: TItem) => string,
) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const filteredItems = !debouncedSearch
    ? items
    : items.filter(item =>
        searchPredicate(item)
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()),
      );

  return {
    filteredItems,
    search,
    setSearch,
  };
}
