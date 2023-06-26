import { AriaButtonProps } from "@react-types/button";
import { AriaSearchFieldProps } from "@react-types/searchfield";
import { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, RefObject } from "react";
import { SearchFieldState } from "@react-stately/searchfield";
interface SearchFieldAria {
    /** Props for the text field's visible label element (if any). */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the clear button. */
    clearButtonProps: AriaButtonProps;
    /** Props for the searchfield's description element, if any. */
    descriptionProps: HTMLAttributes<HTMLElement>;
    /** Props for the searchfield's error message element, if any. */
    errorMessageProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a search field.
 * @param props - Props for the search field.
 * @param state - State for the search field, as returned by `useSearchFieldState`.
 * @param inputRef - A ref to the input element.
 */
export function useSearchField(props: AriaSearchFieldProps, state: SearchFieldState, inputRef: RefObject<HTMLInputElement>): SearchFieldAria;

//# sourceMappingURL=types.d.ts.map
