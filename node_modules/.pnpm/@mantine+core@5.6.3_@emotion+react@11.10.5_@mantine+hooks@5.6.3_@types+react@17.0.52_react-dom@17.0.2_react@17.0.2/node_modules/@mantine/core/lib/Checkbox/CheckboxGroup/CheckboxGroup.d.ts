import React from 'react';
import { DefaultProps, MantineNumberSize, MantineSize } from '@mantine/styles';
import { InputWrapperBaseProps, InputWrapperStylesNames } from '../../Input';
export declare type CheckboxGroupStylesNames = InputWrapperStylesNames;
export interface CheckboxGroupProps extends DefaultProps<CheckboxGroupStylesNames>, InputWrapperBaseProps, Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
    /** <Checkbox /> components only */
    children: React.ReactNode;
    /** Value of currently selected checkbox */
    value?: string[];
    /** Initial value for uncontrolled component */
    defaultValue?: string[];
    /** Called when value changes */
    onChange?(value: string[]): void;
    /** Horizontal or vertical orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Spacing between checkboxes in horizontal orientation */
    spacing?: MantineNumberSize;
    /** Space between label and inputs */
    offset?: MantineNumberSize;
    /** Predefined label fontSize, checkbox width, height and border-radius */
    size?: MantineSize;
    /** Props spread to InputWrapper */
    wrapperProps?: Record<string, any>;
}
export declare const CheckboxGroup: React.ForwardRefExoticComponent<CheckboxGroupProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=CheckboxGroup.d.ts.map