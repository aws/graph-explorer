import React from 'react';
import { DefaultProps, MantineNumberSize, MantineShadow } from '@mantine/styles';
import { PaperStylesParams } from './Paper.styles';
export interface PaperProps extends DefaultProps<never, PaperStylesParams> {
    /** Predefined box-shadow from theme.shadows (xs, sm, md, lg, xl) or any valid css box-shadow property */
    shadow?: MantineShadow;
    /** Predefined border-radius value from theme.radius or number for border-radius in px */
    radius?: MantineNumberSize;
    /** Adds 1px border with theme.colors.gray[3] color in light color scheme and theme.colors.dark[4] in dark color scheme */
    withBorder?: boolean;
    /** Paper children */
    children?: React.ReactNode;
}
export declare const _Paper: React.ForwardRefExoticComponent<PaperProps & React.RefAttributes<HTMLDivElement>>;
export declare const Paper: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, PaperProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(PaperProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof PaperProps> & {
    ref?: any;
}) | (PaperProps & {
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=Paper.d.ts.map