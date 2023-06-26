import React from 'react';
import { DefaultProps, MantineNumberSize, MantineColor } from '@mantine/styles';
export declare type DividerStylesNames = 'label';
export interface DividerProps extends DefaultProps<DividerStylesNames>, React.ComponentPropsWithoutRef<'div'> {
    /** Line color from theme, defaults to gray in light color scheme and to dark in dark color scheme */
    color?: MantineColor;
    /** Line orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Sets height in horizontal orientation and width in vertical */
    size?: MantineNumberSize;
    /** Adds text after line in horizontal orientation */
    label?: React.ReactNode;
    /** Label position */
    labelPosition?: 'left' | 'center' | 'right';
    /** Props spread to Text component in label */
    labelProps?: Record<string, any>;
    /** Divider borderStyle */
    variant?: 'solid' | 'dashed' | 'dotted';
}
export declare const Divider: React.ForwardRefExoticComponent<DividerProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Divider.d.ts.map