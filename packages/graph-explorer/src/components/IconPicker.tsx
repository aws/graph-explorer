import { SearchIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { useState } from "react";

import { getLucideName, toLucideIconRef } from "@/utils/lucideIconUrl";

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

type IconName = keyof typeof dynamicIconImports;
const allIconNames = (Object.keys(dynamicIconImports) as IconName[]).toSorted();

const MAX_VISIBLE = 64;

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

  const selectedName = getLucideName(currentIconUrl);
  const filtered = filterIcons(search);

  function handleSelect(iconName: IconName) {
    onSelect(toLucideIconRef(iconName), "image/svg+xml");
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          onChange={e => setSearch(e.target.value)}
        />
        <div className="grid size-80 grid-cols-8 grid-rows-8 gap-0.5">
          {filtered.map(name => (
            <IconButton
              key={name}
              name={name}
              selected={name === selectedName}
              onSelect={handleSelect}
            />
          ))}
          {filtered.length === 0 && (
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
        {!search && (
          <p className="text-text-secondary text-xs">
            Showing {MAX_VISIBLE} of {allIconNames.length} icons. Type to
            search.
          </p>
        )}
      </PopoverContent>
    </Popover>
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
  if (!search) return allIconNames.slice(0, MAX_VISIBLE);
  const lower = search.toLowerCase();
  const results: IconName[] = [];
  for (const name of allIconNames) {
    if (name.includes(lower)) {
      results.push(name);
      if (results.length >= MAX_VISIBLE) break;
    }
  }
  return results;
}
