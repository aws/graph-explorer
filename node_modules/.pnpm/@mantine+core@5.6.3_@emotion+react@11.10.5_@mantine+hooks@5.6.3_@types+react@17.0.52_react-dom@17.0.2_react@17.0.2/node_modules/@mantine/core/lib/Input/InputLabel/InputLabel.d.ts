import React from 'react';
import { DefaultProps, MantineSize, Selectors } from '@mantine/styles';
import useStyles, { InputLabelStylesParams } from './InputLabel.styles';
export declare type InputLabelStylesNames = Selectors<typeof useStyles>;
export interface InputLabelProps extends DefaultProps<InputLabelStylesNames, InputLabelStylesParams>, React.ComponentPropsWithoutRef<'label'> {
    /** Label content */
    children?: React.ReactNode;
    /** Label root element */
    labelElement?: 'label' | 'div';
    /** Determines whether required asterisk should be displayed */
    required?: boolean;
    /** Predefined label size */
    size?: MantineSize;
    __staticSelector?: string;
}
export declare const InputLabel: React.ForwardRefExoticComponent<InputLabelProps & React.RefAttributes<HTMLLabelElement>>;
//# sourceMappingURL=InputLabel.d.ts.map