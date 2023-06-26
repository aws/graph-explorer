import React from 'react';
import { DefaultProps, MantineNumberSize, MantineColor, Selectors, MantineGradient } from '@mantine/styles';
import { AvatarGroup } from './AvatarGroup/AvatarGroup';
import useStyles, { AvatarStylesParams, AvatarVariant } from './Avatar.styles';
export declare type AvatarStylesNames = Selectors<typeof useStyles>;
export interface AvatarProps extends DefaultProps<AvatarStylesNames, AvatarStylesParams> {
    /** Image url */
    src?: string | null;
    /** Image alt text or title for placeholder variant */
    alt?: string;
    /** Avatar width and height */
    size?: MantineNumberSize;
    /** Value from theme.radius or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Color from theme.colors used for letter and icon placeholders */
    color?: MantineColor;
    /** Controls appearance */
    variant?: AvatarVariant;
    /** Controls gradient settings in gradient variant only */
    gradient?: MantineGradient;
    /** img element attributes */
    imageProps?: Record<string, any>;
    /** Custom placeholder */
    children?: React.ReactNode;
}
export declare const _Avatar: any;
export declare const Avatar: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, AvatarProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(AvatarProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof AvatarProps> & {
    ref?: any;
}) | (AvatarProps & {
    component: React.ElementType<any>;
})>, never> & {
    Group: typeof AvatarGroup;
};
//# sourceMappingURL=Avatar.d.ts.map