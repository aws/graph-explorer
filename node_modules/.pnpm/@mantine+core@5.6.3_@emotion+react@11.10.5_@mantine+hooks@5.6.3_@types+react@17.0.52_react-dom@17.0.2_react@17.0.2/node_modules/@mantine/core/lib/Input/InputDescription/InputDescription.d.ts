import React from 'react';
import { DefaultProps, MantineSize, Selectors } from '@mantine/styles';
import useStyles, { InputDescriptionStylesParams } from './InputDescription.styles';
export declare type InputDescriptionStylesNames = Selectors<typeof useStyles>;
export interface InputDescriptionProps extends DefaultProps<InputDescriptionStylesNames, InputDescriptionStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Description content */
    children?: React.ReactNode;
    /** Predefined size */
    size?: MantineSize;
    __staticSelector?: string;
}
export declare const InputDescription: React.ForwardRefExoticComponent<InputDescriptionProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=InputDescription.d.ts.map