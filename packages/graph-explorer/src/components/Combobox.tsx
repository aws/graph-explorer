import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { type ReactVirtualizer, useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDownIcon } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/utils";

export interface ComboboxOption {
  label: string;
  value: string;
}

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

type Virtualizer = ReactVirtualizer<HTMLDivElement, Element>;

function isSameOption(a: ComboboxOption, b: ComboboxOption) {
  return a.value === b.value;
}

/**
 * Virtualized combobox component for large option lists (10,000+). Wraps
 * Base UI's combobox primitives (accessible listbox/combobox semantics,
 * ARIA wiring, positioning) with TanStack Virtual (windowed rendering).
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
  const [filterText, setFilterText] = useState("");
  const virtualizerRef = useRef<Virtualizer | null>(null);
  // Anchors the popup to the whole bordered control (input + trigger
  // button), matching SelectTrigger's width. Base UI's own default anchor
  // is just the Input, which is narrower.
  const triggerRef = useRef<HTMLDivElement>(null);
  // The virtualizer must measure Combobox.List itself (the bounded,
  // overflow-y-auto viewport) — not the inner spacer div, which is
  // deliberately as tall as the full option list. Measuring the spacer
  // reports its own (huge) height as the "visible" viewport, so the
  // virtualizer concludes almost every item is visible and renders
  // thousands of real DOM nodes instead of ~20.
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) virtualizerRef.current?.measure();
    },
    [],
  );

  // Defer filtered list rendering to keep input responsive during filtering
  const deferredFilter = useDeferredValue(filterText);

  const filteredOptions = useMemo(() => {
    const lowerFilter = deferredFilter.toLowerCase();
    if (!lowerFilter) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(lowerFilter));
  }, [deferredFilter, options]);

  const selectedOption = options.find(opt => opt.value === value) ?? null;
  // Mirrors the closed-state label until the user types, without needing a
  // separate "display value" prop on Base UI's fully-controlled Input.
  const inputValue = filterText || (selectedOption?.label ?? "");

  return (
    <div className={cn("relative w-full", className)}>
      <BaseCombobox.Root
        items={options}
        filteredItems={filteredOptions}
        isItemEqualToValue={isSameOption}
        value={selectedOption}
        onValueChange={next => onValueChange?.(next ? next.value : "")}
        inputValue={inputValue}
        onInputValueChange={next => {
          setFilterText(next);
          setOpen(true);
        }}
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          // Blur alone never closes the list (matches the previously
          // validated behavior, where only Escape, an outside click, or a
          // selection did); only "not on focus" governs opening.
          if (!nextOpen && eventDetails.reason === "focus-out") return;
          setOpen(nextOpen);
          // Single reset point for the filter, covering every other close
          // reason (Escape, outside click, selection) instead of scattering
          // `setFilterText("")` across individual handlers.
          if (!nextOpen) setFilterText("");
        }}
        onItemHighlighted={(_item, { reason, index }) => {
          // Keyboard navigation scrolls the active item into view; mouse
          // hover only highlights it, matching the previously validated
          // behavior (fixed across several rounds of manual testing).
          if (reason !== "keyboard") return;
          virtualizerRef.current?.scrollToIndex(index, { align: "center" });
        }}
        disabled={disabled}
      >
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
            <BaseCombobox.Input
              {...inputProps}
              disabled={disabled}
              placeholder={!selectedOption ? placeholder : ""}
              className="placeholder:text-muted-foreground w-full bg-transparent outline-hidden"
              onClick={() => {
                // A <button> has "click" as its native default action, which
                // is what VoiceOver's Control-Option-Space reliably triggers
                // (this is how the button-based Select/SelectField opens
                // under VoiceOver). A text input has no such default action,
                // so give it an explicit one instead of relying on Base UI's
                // pointer-based open detection to recognize a synthetic
                // click. Only open, never toggle closed: closing on a
                // second click would fight repositioning the cursor while
                // typing.
                if (!open) setOpen(true);
              }}
              onKeyDown={e => {
                // VoiceOver's built-in combobox hint tells users to press
                // Control-Option-Space to show the list. That gesture isn't
                // bound to anything by default, so on macOS the Option
                // modifier types a literal non-breaking space into the
                // field instead. Honor the hint directly and swallow the
                // keystroke so it can't leak into the filter text.
                if (e.ctrlKey && e.altKey && e.code === "Space") {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />
          </div>
          <BaseCombobox.Trigger
            disabled={disabled}
            // Purely a decorative, mouse/touch-only affordance, like the
            // arrow on a native <select>: ArrowDown on the input already
            // opens the list. Excluding it from the accessibility tree (not
            // just the Tab order) keeps screen readers from seeing the
            // trigger as a group of two controls to interact with —
            // VoiceOver in particular reads Control-Option-Space on a
            // grouped control as "stop interacting with this group" and
            // pops focus off the input instead of opening the list. Base
            // UI's own Trigger (rather than a hand-rolled button) is what
            // makes a second click reliably close the list instead of
            // racing the library's own open-state handling.
            tabIndex={-1}
            aria-hidden="true"
            className="hover:bg-input-background ml-2 shrink-0 p-1 disabled:cursor-not-allowed"
          >
            <BaseCombobox.Icon>
              <ChevronDownIcon
                className={cn(
                  "size-5 transition-transform duration-200",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            </BaseCombobox.Icon>
          </BaseCombobox.Trigger>
        </div>

        <BaseCombobox.Portal>
          <BaseCombobox.Positioner
            anchor={triggerRef}
            className="z-menu outline-none"
            sideOffset={4}
          >
            <BaseCombobox.Popup
              className={cn(
                "bg-background text-foreground border-input-border",
                // No duration-* override: matches SelectContent's entrance
                // (tw-animate-css's 150ms default). The 300ms this used to
                // carry made the list feel twice as slow to appear as every
                // other dropdown in the app.
                "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 origin-(--transform-origin) transition-none",
                "max-h-96 w-(--anchor-width) overflow-hidden rounded-md border shadow-md",
              )}
            >
              <BaseCombobox.Empty
                // Base UI keeps this element mounted at all times (even with
                // results) so screen readers get consistent live-region
                // announcements — only its children are conditional. Left
                // unguarded, its own p-3 still reserves ~24px above the
                // list even when there's nothing inside it to show.
                className="text-muted-foreground p-3 text-center text-sm empty:p-0"
              >
                No results found
              </BaseCombobox.Empty>
              <BaseCombobox.List
                ref={handleScrollElementRef}
                className="max-h-96 overflow-x-hidden overflow-y-auto"
              >
                <VirtualizedOptions
                  virtualizerRef={virtualizerRef}
                  scrollElementRef={scrollElementRef}
                />
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </div>
  );
}

/**
 * Renders only the visible options (~20 DOM nodes), even with 10,000+
 * options. Must be a descendant of Combobox.Root to reach filtered items via
 * context; that's also why the virtualizer instance is exposed through a
 * ref instead of living in the parent scope.
 */
function VirtualizedOptions({
  virtualizerRef,
  scrollElementRef,
}: {
  virtualizerRef: React.RefObject<Virtualizer | null>;
  scrollElementRef: React.RefObject<HTMLDivElement | null>;
}) {
  const filteredOptions = BaseCombobox.useFilteredItems<ComboboxOption>();

  // eslint-disable-next-line react-compiler/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 40, // ~40px per item
    overscan: 5, // Render 5 items outside visible area for smoother scroll
  });

  useImperativeHandle(virtualizerRef, () => virtualizer);

  // Combobox.List (the real scrollable viewport) mounts in the same commit
  // as this component, so scrollElementRef is already populated by the time
  // this runs — force a measurement against its real dimensions instead of
  // waiting for a resize-observer tick.
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      role="presentation"
      style={{ height: `${totalSize}px`, position: "relative" }}
    >
      {virtualItems.map(virtualItem => {
        const option = filteredOptions[virtualItem.index];
        if (!option) return null;

        return (
          <BaseCombobox.Item
            key={virtualItem.key}
            index={virtualItem.index}
            value={option}
            tabIndex={-1}
            aria-setsize={filteredOptions.length}
            aria-posinset={virtualItem.index + 1}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className={cn(
              "text-foreground data-highlighted:bg-primary-subtle",
              "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm outline-hidden transition-colors duration-100",
            )}
          >
            <span className="block truncate">{option.label}</span>
            <BaseCombobox.ItemIndicator className="ml-2 shrink-0 font-semibold">
              ✓
            </BaseCombobox.ItemIndicator>
          </BaseCombobox.Item>
        );
      })}
    </div>
  );
}

export default Combobox;
