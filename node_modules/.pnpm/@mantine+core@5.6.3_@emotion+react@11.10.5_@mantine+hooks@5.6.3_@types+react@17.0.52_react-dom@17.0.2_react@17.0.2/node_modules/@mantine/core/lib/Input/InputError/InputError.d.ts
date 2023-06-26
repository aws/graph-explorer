import React from 'react';
import { DefaultProps, MantineSize, Selectors } from '@mantine/styles';
import useStyles, { InputErrorStylesParams } from './InputError.styles';
export declare type InputErrorStylesNames = Selectors<typeof useStyles>;
export interface InputErrorProps extends DefaultProps<InputErrorStylesNames, InputErrorStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Error content */
    children?: React.ReactNode;
    /** Predefined size */
    size?: MantineSize;
    __staticSelector?: string;
}
export declare const InputError: React.ForwardRefExoticComponent<InputErrorProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=InputError.d.ts.map