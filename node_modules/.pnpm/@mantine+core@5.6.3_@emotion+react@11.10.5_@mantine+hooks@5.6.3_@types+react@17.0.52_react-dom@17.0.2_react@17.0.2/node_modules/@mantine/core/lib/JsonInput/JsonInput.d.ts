import React from 'react';
import { DefaultProps } from '@mantine/styles';
import { TextareaProps } from '../Textarea';
import { TextInputStylesNames } from '../TextInput';
export declare type JsonInputStylesNames = TextInputStylesNames;
export interface JsonInputProps extends DefaultProps<JsonInputStylesNames>, Omit<TextareaProps, 'onChange'> {
    /** Value for controlled input */
    value?: string;
    /** Default value for uncontrolled input */
    defaultValue?: string;
    /** onChange value for controlled input */
    onChange?(value: string): void;
    /** Format json on blur */
    formatOnBlur?: boolean;
    /** Error message shown when json is not valid */
    validationError?: React.ReactNode;
}
export declare const JsonInput: React.ForwardRefExoticComponent<JsonInputProps & React.RefAttributes<HTMLTextAreaElement>>;
//# sourceMappingURL=JsonInput.d.ts.map