import { Key, HTMLAttributes, ReactNode, RefObject } from "react";
import { ListState } from "@react-stately/list";
import { AriaListBoxProps } from "@react-types/listbox";
import { KeyboardDelegate } from "@react-types/shared";
interface ListData {
    id: string;
    shouldSelectOnPressUp?: boolean;
    shouldFocusOnHover?: boolean;
    shouldUseVirtualFocus?: boolean;
    isVirtualized?: boolean;
}
export const listData: WeakMap<ListState<unknown>, ListData>;
export function getItemId<T>(state: ListState<T>, itemKey: Key): string;
interface ListBoxAria {
    /** Props for the listbox element. */
    listBoxProps: HTMLAttributes<HTMLElement>;
    /** Props for the listbox's visual label element (if any). */
    labelProps: HTMLAttributes<HTMLElement>;
}
export interface AriaListBoxOptions<T> extends Omit<AriaListBoxProps<T>, 'children'> {
    /** Whether the listbox uses virtual scrolling. */
    isVirtualized?: boolean;
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * Whether the listbox items should use virtual focus instead of being focused directly.
     */
    shouldUseVirtualFocus?: boolean;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** Whether options should be focused when the user hovers over them. */
    shouldFocusOnHover?: boolean;
    /**
     * An optional visual label for the listbox.
     */
    label?: ReactNode;
}
/**
 * Provides the behavior and accessibility implementation for a listbox component.
 * A listbox displays a list of options and allows a user to select one or more of them.
 * @param props - Props for the listbox.
 * @param state - State for the listbox, as returned by `useListState`.
 */
export function useListBox<T>(props: AriaListBoxOptions<T>, state: ListState<T>, ref: RefObject<HTMLElement>): ListBoxAria;
interface OptionAria {
    /** Props for the option element. */
    optionProps: HTMLAttributes<HTMLElement>;
    /** Props for the main text element inside the option. */
    labelProps: HTMLAttributes<HTMLElement>;
    /** Props for the description text element inside the option, if any. */
    descriptionProps: HTMLAttributes<HTMLElement>;
    /** Whether the option is currently focused. */
    isFocused: boolean;
    /** Whether the option is currently selected. */
    isSelected: boolean;
    /** Whether the option is currently in a pressed state. */
    isPressed: boolean;
    /** Whether the option is disabled. */
    isDisabled: boolean;
}
interface AriaOptionProps {
    /**
     * Whether the option is disabled.
     * @deprecated
     */
    isDisabled?: boolean;
    /**
     * Whether the option is selected.
     * @deprecated
     */
    isSelected?: boolean;
    /** A screen reader only label for the option. */
    'aria-label'?: string;
    /** The unique key for the option. */
    key: Key;
    /**
     * Whether selection should occur on press up instead of press down.
     * @deprecated
     */
    shouldSelectOnPressUp?: boolean;
    /**
     * Whether the option should be focused when the user hovers over it.
     * @deprecated
     */
    shouldFocusOnHover?: boolean;
    /**
     * Whether the option is contained in a virtual scrolling listbox.
     * @deprecated
     */
    isVirtualized?: boolean;
    /**
     * Whether the option should use virtual focus instead of being focused directly.
     * @deprecated
     */
    shouldUseVirtualFocus?: boolean;
}
/**
 * Provides the behavior and accessibility implementation for an option in a listbox.
 * See `useListBox` for more details about listboxes.
 * @param props - Props for the option.
 * @param state - State for the listbox, as returned by `useListState`.
 */
export function useOption<T>(props: AriaOptionProps, state: ListState<T>, ref: RefObject<HTMLElement>): OptionAria;
interface AriaListBoxSectionProps {
    /** The heading for the section. */
    heading?: ReactNode;
    /** An accessibility label for the section. Required if `heading` is not present. */
    'aria-label'?: string;
}
interface ListBoxSectionAria {
    /** Props for the wrapper list item. */
    itemProps: HTMLAttributes<HTMLElement>;
    /** Props for the heading element, if any. */
    headingProps: HTMLAttributes<HTMLElement>;
    /** Props for the group element. */
    groupProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a section in a listbox.
 * See `useListBox` for more details about listboxes.
 * @param props - Props for the section.
 */
export function useListBoxSection(props: AriaListBoxSectionProps): ListBoxSectionAria;

//# sourceMappingURL=types.d.ts.map
