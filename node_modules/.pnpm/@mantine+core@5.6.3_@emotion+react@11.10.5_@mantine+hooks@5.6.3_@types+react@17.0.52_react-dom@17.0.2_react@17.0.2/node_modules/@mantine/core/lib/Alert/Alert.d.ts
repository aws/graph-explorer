import React from 'react';
import { DefaultProps, MantineColor, Selectors, MantineNumberSize } from '@mantine/styles';
import useStyles, { AlertStylesParams, AlertVariant } from './Alert.styles';
export declare type AlertStylesNames = Selectors<typeof useStyles>;
export interface AlertProps extends DefaultProps<AlertStylesNames, AlertStylesParams>, Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
    /** Alert title */
    title?: React.ReactNode;
    /** Controls Alert background, color and border styles, defaults to light */
    variant?: AlertVariant;
    /** Alert message */
    children: React.ReactNode;
    /** Color from theme.colors */
    color?: MantineColor;
    /** Icon displayed next to title */
    icon?: React.ReactNode;
    /** True to display close button */
    withCloseButton?: boolean;
    /** Called when close button is clicked */
    onClose?(): void;
    /** Close button aria-label */
    closeButtonLabel?: string;
    /** Radius from theme.radius, or number to set border-radius in px, defaults to theme.defaultRadius */
    radius?: MantineNumberSize;
}
export declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Alert.d.ts.map