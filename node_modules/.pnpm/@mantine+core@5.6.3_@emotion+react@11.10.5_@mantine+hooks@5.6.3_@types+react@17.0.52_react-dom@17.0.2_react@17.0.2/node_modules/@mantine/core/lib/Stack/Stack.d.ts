import React from 'react';
import { DefaultProps, MantineNumberSize } from '@mantine/styles';
import { StackStylesParams } from './Stack.styles';
export interface StackProps extends DefaultProps<never, StackStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Key of theme.spacing or number to set gap in px */
    spacing?: MantineNumberSize;
    /** align-items CSS property */
    align?: React.CSSProperties['alignItems'];
    /** justify-content CSS property */
    justify?: React.CSSProperties['justifyContent'];
}
export declare const Stack: React.ForwardRefExoticComponent<StackProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Stack.d.ts.map