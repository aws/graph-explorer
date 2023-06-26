import { AriaTextFieldProps } from "@react-types/textfield";
import { DOMFactory, HTMLAttributes, LabelHTMLAttributes, ReactDOM, RefObject } from "react";
/**
 * A map of HTML element names and their interface types.
 * For example `'a'` -> `HTMLAnchorElement`.
 */
type IntrinsicHTMLElements = {
    [K in keyof IntrinsicHTMLAttributes]: IntrinsicHTMLAttributes[K] extends HTMLAttributes<infer T> ? T : never;
};
/**
 * A map of HTML element names and their attribute interface types.
 * For example `'a'` -> `AnchorHTMLAttributes<HTMLAnchorElement>`.
 */
type IntrinsicHTMLAttributes = {
    [K in keyof ReactDOM]: ReactDOM[K] extends DOMFactory<infer T, any> ? T : never;
};
type DefaultElementType = 'input';
/**
 * The intrinsic HTML element names that `useTextField` supports; e.g. `input`,
 * `textarea`.
 */
type TextFieldIntrinsicElements = keyof Pick<IntrinsicHTMLElements, 'input' | 'textarea'>;
/**
 * The HTML element interfaces that `useTextField` supports based on what is
 * defined for `TextFieldIntrinsicElements`; e.g. `HTMLInputElement`,
 * `HTMLTextAreaElement`.
 */
type TextFieldHTMLElementType = Pick<IntrinsicHTMLElements, TextFieldIntrinsicElements>;
/**
 * The HTML attributes interfaces that `useTextField` supports based on what
 * is defined for `TextFieldIntrinsicElements`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldHTMLAttributesType = Pick<IntrinsicHTMLAttributes, TextFieldIntrinsicElements>;
/**
 * The type of `inputProps` returned by `useTextField`; e.g. `InputHTMLAttributes`,
 * `TextareaHTMLAttributes`.
 */
type TextFieldInputProps<T extends TextFieldIntrinsicElements> = TextFieldHTMLAttributesType[T];
interface AriaTextFieldOptions<T extends TextFieldIntrinsicElements> extends AriaTextFieldProps {
    /**
     * The HTML element used to render the input, e.g. 'input', or 'textarea'.
     * It determines whether certain HTML attributes will be included in `inputProps`.
     * For example, [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-type).
     * @default 'input'
     */
    inputElementType?: T;
}
/**
 * The type of `ref` object that can be passed to `useTextField` based on the given
 * intrinsic HTML element name; e.g.`RefObject<HTMLInputElement>`,
 * `RefObject<HTMLTextAreaElement>`.
 */
type TextFieldRefObject<T extends TextFieldIntrinsicElements> = RefObject<TextFieldHTMLElementType[T]>;
export interface TextFieldAria<T extends TextFieldIntrinsicElements = DefaultElementType> {
    /** Props for the input element. */
    inputProps: TextFieldInputProps<T>;
    /** Props for the text field's visible label element, if any. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the text field's description element, if any. */
    descriptionProps: HTMLAttributes<HTMLElement>;
    /** Props for the text field's error message element, if any. */
    errorMessageProps: HTMLAttributes<HTMLElement>;
}
/**
 * Provides the behavior and accessibility implementation for a text field.
 * @param props - Props for the text field.
 * @param ref - Ref to the HTML input or textarea element.
 */
export function useTextField<T extends TextFieldIntrinsicElements = DefaultElementType>(props: AriaTextFieldOptions<T>, ref: TextFieldRefObject<T>): TextFieldAria<T>;
interface FormattedTextFieldState {
    validate: (val: string) => boolean;
    setInputValue: (val: string) => void;
}
export function useFormattedTextField(props: AriaTextFieldProps, state: FormattedTextFieldState, inputRef: RefObject<HTMLInputElement>): TextFieldAria;

//# sourceMappingURL=types.d.ts.map
