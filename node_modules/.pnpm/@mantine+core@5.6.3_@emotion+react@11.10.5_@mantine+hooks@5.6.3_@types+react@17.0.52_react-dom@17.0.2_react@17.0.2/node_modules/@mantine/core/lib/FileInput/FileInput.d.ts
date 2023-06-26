import React from 'react';
import { DefaultProps, MantineSize, Selectors } from '@mantine/styles';
import { InputSharedProps, InputStylesNames, InputWrapperBaseProps, InputWrapperStylesNames } from '../Input';
import useStyles from './FileInput.styles';
export declare type FileInputStylesNames = InputStylesNames | InputWrapperStylesNames | Selectors<typeof useStyles>;
export interface FileInputProps<Multiple extends boolean = false> extends DefaultProps<FileInputStylesNames>, InputSharedProps, InputWrapperBaseProps, Omit<React.ComponentPropsWithoutRef<'button'>, 'size' | 'onChange' | 'value' | 'defaultValue'> {
    /** Props passed to root element (InputWrapper component) */
    wrapperProps?: Record<string, any>;
    /** Called when user picks files */
    onChange?(payload: Multiple extends true ? File[] : File | null): void;
    /** Controlled input value */
    value?: Multiple extends true ? File[] : File | null;
    /** Uncontrolled input default value */
    defaultValue?: Multiple extends true ? File[] : File | null;
    /** Input size */
    size?: MantineSize;
    /** Determines whether user can pick more than one file */
    multiple?: Multiple;
    /** File input accept attribute, for example, "image/png,image/jpeg" */
    accept?: string;
    /** Input name attribute */
    name?: string;
    /** Input form attribute */
    form?: string;
    /** Current value renderer */
    valueComponent?: React.FC<{
        value: null | File | File[];
    }>;
    /** Allow to clear value */
    clearable?: boolean;
    /** aria-label for clear button */
    clearButtonLabel?: string;
    /** Set the clear button tab index to disabled or default after input field */
    clearButtonTabIndex?: -1 | 0;
    /** Determines whether the user can change value */
    readOnly?: boolean;
}
export declare const _FileInput: React.ForwardRefExoticComponent<FileInputProps<false> & React.RefAttributes<HTMLButtonElement>>;
declare type FileInputComponent = <Multiple extends boolean = false>(props: FileInputProps<Multiple> & {
    ref?: React.ForwardedRef<HTMLButtonElement>;
}) => JSX.Element;
export declare const FileInput: FileInputComponent;
export {};
//# sourceMappingURL=FileInput.d.ts.map