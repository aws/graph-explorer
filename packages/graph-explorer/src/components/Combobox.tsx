import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDownIcon } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useId,
  useLayoutEffect,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils";

export interface ComboboxOption {
  label: string;
  value: string;
}

/**
 * Virtualized combobox component for large option lists (10,000+).
 *
 * Features:
 * - Type-to-filter with instant input responsiveness via useDeferredValue
 * - Virtualized list rendering (only visible items in DOM)
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - WCAG 2.1 Level AA accessibility
 * - Matches Select/Radix design tokens
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState("");
 * <Combobox
 *   options={[
 *     { label: "Option 1", value: "opt1" },
 *     { label: "Option 2", value: "opt2" },
 *   ]}
 *   value={value}
 *   onValueChange={setValue}
 *   placeholder="Select an option"
 * />
 * ```
 */
export interface ComboboxProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "value" | "onChange"
> {
  /** Array of options to render */
  options: ComboboxOption[];
  /** Current selected value */
  value?: string;
  /** Called when selection changes */
  onValueChange?: (value: string) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Small caption rendered above the value, matching SelectField's "inner" label placement */
  label?: ReactNode;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Builds the id of a listbox option, shared between the input's aria-activedescendant and the option element. */
function getOptionId(listboxId: string, index: number) {
  return `${listboxId}-option-${index}`;
}

export function Combobox({
  options,
  value = "",
  onValueChange,
  placeholder = "Select an option",
  label,
  disabled = false,
  className,
  ...inputProps
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filterInput, setFilterInput] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigationSourceRef = useRef<"keyboard" | "mouse">("mouse");

  // Defer filtered list rendering to keep input responsive during filtering
  const deferredFilter = useDeferredValue(filterInput);

  // Filter options via substring match (case-insensitive)
  const filteredOptions = useMemo(() => {
    const lowerFilter = deferredFilter.toLowerCase();
    if (!lowerFilter) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(lowerFilter));
  }, [deferredFilter, options]);

  const selectedOption = options.find(opt => opt.value === value);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onValueChange?.(selectedValue);
      setOpen(false);
      setFilterInput("");
    },
    [onValueChange],
  );

  // Close dropdown when clicking outside the combobox
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is outside the trigger
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        // Also check if it's not clicking on the listbox (portal) or scrollbar
        const listbox = document.getElementById(listboxId);
        if (!listbox || !listbox.contains(target)) {
          setOpen(false);
          setFilterInput("");
        }
      }
    };

    // Use capture phase to detect clicks before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [open, listboxId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // VoiceOver's built-in combobox hint tells users to press
      // Control-Option-Space to show the list. That gesture isn't bound to
      // anything by default, so on macOS the Option modifier types a literal
      // non-breaking space into the field instead. Honor the hint directly
      // and swallow the keystroke so it can't leak into the filter text.
      if (e.ctrlKey && e.altKey && e.code === "Space") {
        e.preventDefault();
        if (!open) {
          navigationSourceRef.current = "keyboard";
          setOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        navigationSourceRef.current = "keyboard";
        setOpen(true);
        setFocusedIndex(0);
        return;
      }

      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          navigationSourceRef.current = "keyboard";
          setFocusedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          navigationSourceRef.current = "keyboard";
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (filteredOptions[focusedIndex]) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setFilterInput("");
          break;
      }
    },
    [open, filteredOptions, focusedIndex, handleSelect],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger / Input */}
      <div
        ref={triggerRef}
        className={cn(
          "ring-offset-background border-input-border bg-input-background text-foreground placeholder:text-muted-foreground focus-within:border-primary data-open:border-primary",
          "flex w-full items-center justify-between rounded-md border text-sm whitespace-nowrap shadow-xs transition-colors duration-100",
          label ? "h-11 px-3 py-1" : "h-10 px-3 py-2",
          "focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
          {label ? (
            <span className="text-muted-foreground text-xs leading-none">
              {label}
            </span>
          ) : null}
          <input
            ref={inputRef}
            {...inputProps}
            type="text"
            disabled={disabled}
            placeholder={!selectedOption ? placeholder : ""}
            className="placeholder:text-muted-foreground w-full bg-transparent outline-hidden"
            value={filterInput || (selectedOption?.label ?? "")}
            onChange={e => {
              setFilterInput(e.currentTarget.value);
              setFocusedIndex(0);
              setOpen(true);
            }}
            onClick={() => {
              // A <button> has "click" as its native default action, which is
              // what VoiceOver's Control-Option-Space reliably triggers (this
              // is how the button-based Select/SelectField opens under
              // VoiceOver). A text input has no such default action, so give
              // it an explicit one instead of relying on VoiceOver to infer
              // it. Only open, never toggle closed: closing on a second click
              // would fight repositioning the cursor while typing.
              if (!open) {
                navigationSourceRef.current = "keyboard";
                setOpen(true);
                setFocusedIndex(0);
              }
            }}
            onKeyDown={handleKeyDown}
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={
              open && filteredOptions[focusedIndex]
                ? getOptionId(listboxId, focusedIndex)
                : undefined
            }
            role="combobox"
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          // Purely a decorative, mouse/touch-only affordance, like the arrow
          // on a native <select>: ArrowDown on the input already opens the
          // list. Excluding it from the accessibility tree (not just the Tab
          // order) keeps screen readers from seeing the trigger as a group
          // of two controls to interact with — VoiceOver in particular reads
          // Control-Option-Space on a grouped control as "stop interacting
          // with this group" and pops focus off the input instead of opening
          // the list.
          tabIndex={-1}
          aria-hidden="true"
          className="hover:bg-input-background ml-2 shrink-0 p-1 disabled:cursor-not-allowed"
        >
          <ChevronDownIcon
            className={cn(
              "size-5 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Dropdown listbox via Portal */}
      {open
        ? createPortal(
            <>
              {filteredOptions.length > 0 ? (
                <ListContent
                  listboxId={listboxId}
                  options={filteredOptions}
                  onSelect={handleSelect}
                  triggerRef={triggerRef}
                  focusedIndex={focusedIndex}
                  setFocusedIndex={setFocusedIndex}
                  value={value}
                  navigationSourceRef={navigationSourceRef}
                />
              ) : (
                <NoResultsPopover triggerRef={triggerRef} />
              )}
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function NoResultsPopover({
  triggerRef,
}: {
  triggerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  return (
    <div
      className="bg-background text-foreground border-input-border text-muted-foreground fixed z-50 rounded-md border p-3 text-center text-sm shadow-md"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        width: `${pos.width}px`,
      }}
    >
      No results found
    </div>
  );
}

/**
 * Virtualized list content using TanStack Virtual.
 * Only renders visible items (~20 DOM nodes), even with 10,000+ options.
 */
function ListContent({
  listboxId,
  options,
  onSelect,
  triggerRef,
  focusedIndex,
  setFocusedIndex,
  value,
  navigationSourceRef,
}: {
  listboxId: string;
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  value: string;
  navigationSourceRef: React.RefObject<"keyboard" | "mouse">;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  // eslint-disable-next-line react-compiler/incompatible-library
  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // ~40px per item
    overscan: 5, // Render 5 items outside visible area for smoother scroll
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Scroll focused item into view when keyboard navigating (not on mouse hover)
  useLayoutEffect(() => {
    if (focusedIndex >= 0 && navigationSourceRef.current === "keyboard") {
      virtualizer.scrollToIndex(focusedIndex, { align: "center" });
    }
  }, [focusedIndex, virtualizer]);

  return (
    <div
      ref={parentRef}
      id={listboxId}
      className="bg-background text-foreground border-input-border animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 fixed z-50 max-h-96 origin-top overflow-x-hidden overflow-y-auto rounded-md border shadow-md transition-none duration-300"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        width: `${pos.width}px`,
      }}
      role="listbox"
    >
      {/* Virtual container for absolutely positioned items */}
      <div
        style={{
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map(virtualItem => {
          const option = options[virtualItem.index];
          return (
            <button
              key={virtualItem.key}
              id={getOptionId(listboxId, virtualItem.index)}
              onClick={() => onSelect(option.value)}
              onMouseEnter={() => {
                navigationSourceRef.current = "mouse";
                setFocusedIndex(virtualItem.index);
              }}
              type="button"
              // Virtual focus: DOM focus stays on the combobox input, which
              // tracks the active option via aria-activedescendant. Excluding
              // these from the Tab sequence keeps the list from being
              // tabbed through item by item.
              tabIndex={-1}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm outline-hidden transition-colors duration-100",
                "text-foreground",
                "hover:bg-primary-subtle",
                "focus-visible:bg-primary-subtle",
                virtualItem.index === focusedIndex && "bg-primary-subtle",
              )}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="block truncate">{option.label}</span>
              {option.value === value && (
                <span className="ml-2 shrink-0 font-semibold">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Combobox;
