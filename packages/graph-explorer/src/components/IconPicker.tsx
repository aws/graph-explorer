import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useState } from "react";

import {
  allIconNamesSorted,
  getLucideName,
  type IconName,
  toLucideIconRef,
} from "@/utils/lucideIcons";

import {
  Button,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from ".";

const PAGE_SIZE = 64;

export function IconPicker({
  currentIconUrl,
  onSelect,
}: {
  /**
   * The vertex's currently stored iconUrl. When this is a `lucide:<name>`
   * reference, the matching grid cell is highlighted to indicate the
   * current selection.
   */
  currentIconUrl?: string;
  /**
   * Called with the symbolic `lucide:<name>` reference and the SVG MIME type.
   * Resolution to a data URI happens at render time, not here.
   */
  onSelect: (iconUrl: string, iconImageType: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const selectedName = getLucideName(currentIconUrl);
  const filtered = filterIcons(search);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleSelect(iconName: IconName) {
    onSelect(toLucideIconRef(iconName), "image/svg+xml");
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <SearchIcon className="size-4" />
          Browse
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="flex flex-col gap-4"
      >
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <div className="grid size-80 grid-cols-8 grid-rows-8 gap-0.5">
          {pageRows.map(name => (
            <IconButton
              key={name}
              name={name}
              selected={name === selectedName}
              onSelect={handleSelect}
            />
          ))}
          {pageRows.length === 0 && (
            <EmptyState className="col-span-8 row-span-8" size="small">
              <EmptyStateContent>
                <EmptyStateTitle>No icons found</EmptyStateTitle>
                <EmptyStateDescription className="text-balance">
                  No matching icons found. Try a broader search.
                </EmptyStateDescription>
              </EmptyStateContent>
            </EmptyState>
          )}
        </div>
        {pageCount > 1 && (
          <PagerFooter
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function PagerFooter({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-row items-center justify-end gap-2">
      <p className="text-text-secondary text-sm">
        Page {page + 1} of {pageCount}
      </p>
      <div className="flex">
        <Button
          size="icon-small"
          aria-label="Previous page"
          className="rounded-r-none"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          size="icon-small"
          aria-label="Next page"
          className="rounded-l-none"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= pageCount}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  name,
  selected,
  onSelect,
}: {
  name: IconName;
  selected: boolean;
  onSelect: (name: IconName) => void;
}) {
  return (
    <Button
      title={name}
      aria-pressed={selected}
      size="icon"
      variant={selected ? "primary" : "ghost"}
      onClick={() => onSelect(name)}
      className="size-full min-w-0"
    >
      <DynamicIcon name={name} />
    </Button>
  );
}

function filterIcons(search: string) {
  if (!search) return allIconNamesSorted;
  const lower = search.toLowerCase();
  return allIconNamesSorted.filter(name => name.includes(lower));
}
