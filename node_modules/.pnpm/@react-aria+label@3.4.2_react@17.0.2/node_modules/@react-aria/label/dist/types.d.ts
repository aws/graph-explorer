import { AriaLabelingProps, DOMAttributes, DOMProps, LabelableProps, HelpTextProps, Validation } from "@react-types/shared";
import { ElementType, LabelHTMLAttributes } from "react";
export interface LabelAriaProps extends LabelableProps, DOMProps, AriaLabelingProps {
    /**
     * The HTML element used to render the label, e.g. 'label', or 'span'.
     * @default 'label'
     */
    labelElementType?: ElementType;
}
export interface LabelAria {
    /** Props to apply to the label container element. */
    labelProps: DOMAttributes | LabelHTMLAttributes<HTMLLabelElement>;
    /** Props to apply to the field container element being labeled. */
    fieldProps: AriaLabelingProps & DOMProps;
}
/**
 * Provides the accessibility implementation for labels and their associated elements.
 * Labels provide context for user inputs.
 * @param props - The props for labels and fields.
 */
export function useLabel(props: LabelAriaProps): LabelAria;
export interface AriaFieldProps extends LabelAriaProps, HelpTextProps, Omit<Validation, 'isRequired'> {
}
export interface FieldAria extends LabelAria {
    /** Props for the description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for input fields.
 * Fields accept user input, gain context from their label, and may display a description or error message.
 * @param props - Props for the Field.
 */
export function useField(props: AriaFieldProps): FieldAria;

//# sourceMappingURL=types.d.ts.map
