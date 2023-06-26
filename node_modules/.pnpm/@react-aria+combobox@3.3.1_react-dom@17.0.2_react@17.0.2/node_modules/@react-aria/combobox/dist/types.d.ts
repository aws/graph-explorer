import { AriaButtonProps } from "@react-types/button";
import { AriaComboBoxProps } from "@react-types/combobox";
import { AriaListBoxOptions } from "@react-aria/listbox";
import { ComboBoxState } from "@react-stately/combobox";
import { HTMLAttributes, InputHTMLAttributes, RefObject } from "react";
import { KeyboardDelegate } from "@react-types/shared";
interface AriaComboBoxOptions<T> extends AriaComboBoxProps<T> {
    /** The ref for the input element. */
    inputRef: RefObject<HTMLInputElement>;
    /** The ref for the list box popover. */
    popoverRef: RefObject<HTMLDivElement>;
    /** The ref for the list box. */
    listBoxRef: RefObject<HTMLElement>;
    /** The ref for the optional list box popup trigger button.  */
    buttonRef?: RefObject<HTMLElement>;
    /** An optional keyboard delegate implementation, to override the default. */
    keyboardDelegate?: KeyboardDelegate;
}
interface ComboBoxAria<T> {
    /** Props for the label element. */
    labelProps: HTMLAttributes<HTMLElement>;
    /** Props for the combo box input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the list box, to be passed to [useListBox](useListBox.html). */
    listBoxProps: AriaListBoxOptions<T>;
    /** Props for the optional trigger button, to be passed to [useButton](useButton.html). */
    buttonProps: AriaButtonProps;
    /** Props for the combo box description element, if any. */
    descriptionProps: HTMLAttributes<HTMLElement>;
    /** Props for the combo box error message element, if any. */
    errorMessageProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a combo box component.
 * A combo box combines a text input with a listbox, allowing users to filter a list of options to items matching a query.
 * @param props - Props for the combo box.
 * @param state - State for the select, as returned by `useComboBoxState`.
 */
export function useComboBox<T>(props: AriaComboBoxOptions<T>, state: ComboBoxState<T>): ComboBoxAria<T>;

//# sourceMappingURL=types.d.ts.map
