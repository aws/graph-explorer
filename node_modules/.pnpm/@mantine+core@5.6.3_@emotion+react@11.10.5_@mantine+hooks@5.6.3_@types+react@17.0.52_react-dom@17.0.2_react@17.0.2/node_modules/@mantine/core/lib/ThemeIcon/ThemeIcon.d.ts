import React from 'react';
import { DefaultProps, MantineNumberSize, MantineGradient, MantineColor } from '@mantine/styles';
import { ThemeIconVariant, ThemeIconStylesParams } from './ThemeIcon.styles';
export interface ThemeIconProps extends DefaultProps<never, ThemeIconStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Icon */
    children: React.ReactNode;
    /** Predefined width and height or number for width and height in px */
    size?: MantineNumberSize;
    /** Predefined border-radius from theme.radius or number for border-radius in px */
    radius?: MantineNumberSize;
    /** Icon color from theme */
    color?: MantineColor;
    /** Controls appearance */
    variant?: ThemeIconVariant;
    /** Controls gradient settings in gradient variant only */
    gradient?: MantineGradient;
}
export declare const ThemeIcon: React.ForwardRefExoticComponent<ThemeIconProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ThemeIcon.d.ts.map