import { SearchIcon } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils";
import {
  getLucideName,
  lucideIconToDataUri,
  toLucideIconRef,
} from "@/utils/lucideIconUrl";

import { Button, Input, Popover, PopoverContent, PopoverTrigger } from ".";

const allIconNames = Object.keys(dynamicIconImports).sort();

const MAX_VISIBLE = 50;

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
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedName = getLucideName(currentIconUrl);
  const filtered = filterIcons(search);

  function handleSelect(iconName: string) {
    onSelect(toLucideIconRef(iconName), "image/svg+xml");
    setOpen(false);
    setSearch("");
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

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
        className="flex w-80 flex-col gap-2 p-3"
      >
        <Input
          ref={inputRef}
          placeholder="Search icons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="grid max-h-60 grid-cols-8 gap-1 overflow-y-auto">
          {filtered.map(name => (
            <IconButton
              key={name}
              name={name}
              selected={name === selectedName}
              onSelect={handleSelect}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-text-secondary col-span-8 py-4 text-center text-sm">
              No icons found
            </p>
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
  name: string;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    lucideIconToDataUri(name).then(
      uri => {
        if (!cancelled && uri) setSrc(uri);
      },
      () => {
        // Icon failed to load, leave as placeholder
      },
    );
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <button
      type="button"
      title={name}
      aria-pressed={selected}
      className={cn(
        "hover:bg-background-contrast-secondary flex size-8 items-center justify-center rounded",
        selected && "bg-primary-main/20 ring-primary-main ring-2",
      )}
      onClick={() => onSelect(name)}
    >
      {src ? (
        <img src={src} alt={name} className="size-5" />
      ) : (
        <div className="bg-background-contrast-secondary size-5 animate-pulse rounded" />
      )}
    </button>
  );
}

function filterIcons(search: string): string[] {
  if (!search) return allIconNames.slice(0, MAX_VISIBLE);
  const lower = search.toLowerCase();
  const results: string[] = [];
  for (const name of allIconNames) {
    if (name.includes(lower)) {
      results.push(name);
      if (results.length >= MAX_VISIBLE) break;
    }
  }
  return results;
}
