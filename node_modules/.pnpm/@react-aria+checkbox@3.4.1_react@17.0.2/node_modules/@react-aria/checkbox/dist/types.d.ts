import { AriaCheckboxProps, AriaCheckboxGroupProps, AriaCheckboxGroupItemProps } from "@react-types/checkbox";
import { InputHTMLAttributes, RefObject, HTMLAttributes } from "react";
import { ToggleState } from "@react-stately/toggle";
import { CheckboxGroupState } from "@react-stately/checkbox";
export interface CheckboxAria {
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
}
/**
 * Provides the behavior and accessibility implementation for a checkbox component.
 * Checkboxes allow users to select multiple items from a list of individual items, or
 * to mark one individual item as selected.
 * @param props - Props for the checkbox.
 * @param state - State for the checkbox, as returned by `useToggleState`.
 * @param inputRef - A ref for the HTML input element.
 */
export function useCheckbox(props: AriaCheckboxProps, state: ToggleState, inputRef: RefObject<HTMLInputElement>): CheckboxAria;
interface CheckboxGroupAria {
    /** Props for the checkbox group wrapper element. */
    groupProps: HTMLAttributes<HTMLElement>;
    /** Props for the checkbox group's visible label (if any). */
    labelProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a checkbox group component.
 * Checkbox groups allow users to select multiple items from a list of options.
 * @param props - Props for the checkbox group.
 * @param state - State for the checkbox group, as returned by `useCheckboxGroupState`.
 */
export function useCheckboxGroup(props: AriaCheckboxGroupProps, state: CheckboxGroupState): CheckboxGroupAria;
/**
 * Provides the behavior and accessibility implementation for a checkbox component contained within a checkbox group.
 * Checkbox groups allow users to select multiple items from a list of options.
 * @param props - Props for the checkbox.
 * @param state - State for the checkbox, as returned by `useCheckboxGroupState`.
 * @param inputRef - A ref for the HTML input element.
 */
export function useCheckboxGroupItem(props: AriaCheckboxGroupItemProps, state: CheckboxGroupState, inputRef: RefObject<HTMLInputElement>): CheckboxAria;

//# sourceMappingURL=types.d.ts.map
