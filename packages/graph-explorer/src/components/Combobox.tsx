import type { ReactNode } from "react";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { type ReactVirtualizer, useVirtualizer } from "@tanstack/react-virtual";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useId,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { cn } from "@/utils";

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  /** Array of options to render */
  options: ComboboxOption[];
  /** Current selected value */
  value?: string;
  /** Called when an option is selected */
  onValueChange?: (value: string) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Small caption rendered above the value, matching SelectField's "inner" label placement */
  label?: ReactNode;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional CSS classes for the outer control */
  className?: string;
  /** Forwarded to the input, for external `<label htmlFor>` association */
  id?: string;
  /** Accessible name for the input; omit when using `label` for a visible caption instead */
  "aria-label"?: string;
}

type Virtualizer = ReactVirtualizer<HTMLDivElement, Element>;

function isSameOption(a: ComboboxOption, b: ComboboxOption) {
  return a.value === b.value;
}

// Base UI's own reason taxonomy for onInputValueChange: these three are the
// only reasons that represent the user actually editing the text. Every
// other reason (selection commit syncing the display label, the controlled
// `value` prop changing, initial mount) fires the same callback but must not
// be treated as "the user is filtering" or the input would visibly reopen
// itself right after a selection.
const TYPED_REASONS = new Set(["input-change", "input-paste", "input-clear"]);

type ComboboxState = {
  open: boolean;
  /** null mirrors the selected option's label; a string is an in-progress filter */
  filterText: string | null;
};

type ComboboxAction =
  | { type: "typed"; value: string }
  | { type: "opened" }
  | { type: "closed" };

function comboboxReducer(
  state: ComboboxState,
  action: ComboboxAction,
): ComboboxState {
  switch (action.type) {
    case "typed":
      return { open: true, filterText: action.value };
    case "opened":
      return { ...state, open: true };
    case "closed":
      return { open: false, filterText: null };
  }
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
 * See docs/adr/ for why this wraps Base UI instead of extending the
 * Radix-based Select: Radix's Select can't virtualize 10k+ items without
 * abandoning its item-registration model.
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
  id,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [{ open, filterText }, dispatch] = useReducer(comboboxReducer, {
    open: false,
    filterText: null,
  });
  const captionId = useId();
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
  const deferredFilter = useDeferredValue(filterText ?? "");

  // Base UI's useFilter() returns a fresh Filter object every render (it
  // isn't memoized internally) even though its actual matching behavior
  // never changes here (no locale/sensitivity options are passed in), so
  // including it in the deps below would recompute filteredOptions on every
  // incidental re-render for no behavioral reason.
  const filter = BaseCombobox.useFilter();

  const filteredOptions = useMemo(() => {
    if (!deferredFilter) return options;
    return options.filter(opt =>
      filter.contains(opt, deferredFilter, o => o.label),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `filter` intentionally excluded, see comment above
  }, [deferredFilter, options]);

  const selectedOption = options.find(opt => opt.value === value) ?? null;
  // Mirrors the closed-state label until the user types, without needing a
  // separate "display value" prop on Base UI's fully-controlled Input.
  const inputValue = filterText ?? selectedOption?.label ?? "";

  return (
    <div className={cn("relative w-full", className)}>
      <BaseCombobox.Root
        // Without this, Combobox.List wraps its children in a CompositeList
        // that truncates its ref list to only the currently-mounted rows on
        // every scroll remount, silently bounding keyboard navigation to
        // whatever's visible instead of the full option count.
        virtualized
        items={options}
        filteredItems={filteredOptions}
        isItemEqualToValue={isSameOption}
        value={selectedOption}
        onValueChange={next => {
          if (next) onValueChange?.(next.value);
        }}
        inputValue={inputValue}
        onInputValueChange={(next, eventDetails) => {
          if (TYPED_REASONS.has(eventDetails.reason)) {
            dispatch({ type: "typed", value: next });
          }
        }}
        open={open}
        onOpenChange={nextOpen => {
          dispatch(nextOpen ? { type: "opened" } : { type: "closed" });
        }}
        onItemHighlighted={(_item, { reason, index }) => {
          // "keyboard" is arrow-key navigation; "none" is Base UI
          // auto-highlighting the already-selected item when the popup
          // opens (this is what scrolls a far-down selection into view on
          // open). Mouse hover uses "pointer" and must not scroll, matching
          // previously validated behavior (fixed across several rounds of
          // manual testing).
          if (reason !== "keyboard" && reason !== "none") return;
          virtualizerRef.current?.scrollToIndex(index, { align: "center" });
        }}
        disabled={disabled}
      >
        <div
          ref={triggerRef}
          className={cn(
            "ring-offset-background border-input-border bg-input-background text-foreground placeholder:text-muted-foreground focus-within:border-primary",
            "flex w-full items-center justify-between rounded-md border text-sm whitespace-nowrap shadow-xs transition-colors duration-100",
            label ? "h-11 px-3 py-1" : "h-10 px-3 py-2",
            "focus:outline-hidden has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
            open && "border-primary",
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
            {label ? (
              <span
                id={captionId}
                className="text-muted-foreground text-xs leading-none"
              >
                {label}
              </span>
            ) : null}
            <BaseCombobox.Input
              id={id}
              aria-label={ariaLabel}
              aria-labelledby={!ariaLabel && label ? captionId : undefined}
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
                if (!open) dispatch({ type: "opened" });
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
                  dispatch({ type: "opened" });
                }
              }}
            />
          </div>
          <BaseCombobox.Trigger
            disabled={disabled}
            // Kept in the accessibility tree and tab order on purpose: when
            // the input already has a value, VoiceOver's Read-All treats a
            // filled text input as content to read and skips announcing its
            // combobox role — this button is what re-announces "combo box"
            // in that case (confirmed against shadcn's Base UI reference
            // implementation, which does the same). An earlier revision
            // hid this from screen readers to avoid VoiceOver reading
            // Control-Option-Space on a grouped control as "stop
            // interacting with this group" — re-verify that specific
            // interaction if it resurfaces. Base UI's own Trigger (rather
            // than a hand-rolled button) is what makes a second click
            // reliably close the list instead of racing the library's own
            // open-state handling.
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
                "data-ending-style:animate-out data-ending-style:fade-out-0 data-ending-style:zoom-out-95",
                "max-w-sm min-w-(--anchor-width) overflow-hidden rounded-md border p-1 shadow-md",
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
    estimateSize: () => 40,
    overscan: 5,
  });

  useImperativeHandle(virtualizerRef, () => virtualizer);

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
              "flex w-full cursor-default items-center justify-between rounded-sm px-3 py-2 text-left text-base outline-hidden transition-colors duration-100",
            )}
          >
            <span className="block truncate" title={option.label}>
              {option.label}
            </span>
            <BaseCombobox.ItemIndicator className="ml-2 shrink-0">
              <CheckIcon className="size-4" />
            </BaseCombobox.ItemIndicator>
          </BaseCombobox.Item>
        );
      })}
    </div>
  );
}

export default Combobox;
