import React from 'react';
import { DefaultProps, MantineNumberSize, MantineColor, Selectors, MantineGradient } from '@mantine/styles';
import useStyles, { ActionIconVariant, ActionIconStylesParams } from './ActionIcon.styles';
import { LoaderProps } from '../Loader';
export declare type ActionIconStylesNames = Selectors<typeof useStyles>;
export interface ActionIconProps extends DefaultProps<ActionIconStylesNames, ActionIconStylesParams> {
    /** Icon */
    children?: React.ReactNode;
    /** Controls appearance */
    variant?: ActionIconVariant;
    /** Key of theme.colors */
    color?: MantineColor;
    /** Controls gradient settings in gradient variant only */
    gradient?: MantineGradient;
    /** Button border-radius from theme or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Predefined icon size or number to set width and height in px */
    size?: MantineNumberSize;
    /** Props spread to Loader component */
    loaderProps?: LoaderProps;
    /** Indicates loading state */
    loading?: boolean;
    /** Indicates disabled state */
    disabled?: boolean;
}
export declare const _ActionIcon: React.ForwardRefExoticComponent<ActionIconProps & React.RefAttributes<HTMLButtonElement>>;
export declare const ActionIcon: (<C = "button">(props: import("@mantine/utils").PolymorphicComponentProps<C, ActionIconProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(ActionIconProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof ActionIconProps> & {
    ref?: any;
}) | (ActionIconProps & {
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=ActionIcon.d.ts.map