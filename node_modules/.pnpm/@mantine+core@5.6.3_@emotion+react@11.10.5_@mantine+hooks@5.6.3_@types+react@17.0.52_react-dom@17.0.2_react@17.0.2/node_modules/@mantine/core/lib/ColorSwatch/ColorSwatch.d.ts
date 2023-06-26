import React from 'react';
import { DefaultProps, MantineNumberSize, Selectors } from '@mantine/styles';
import useStyles, { ColorSwatchStylesParams } from './ColorSwatch.styles';
export declare type ColorSwatchStylesNames = Selectors<typeof useStyles>;
export interface ColorSwatchProps extends DefaultProps<ColorSwatchStylesNames, ColorSwatchStylesParams> {
    /** Swatch color value in any css valid format (hex, rgb, etc.) */
    color: string;
    /** Width, height and border-radius in px */
    size?: number;
    /** Swatch border-radius predefined from theme or number for px value */
    radius?: MantineNumberSize;
    /** ColorSwatch children */
    children?: React.ReactNode;
    /**  Determines whether swatch should have inner shadow */
    withShadow?: boolean;
}
export declare const _ColorSwatch: React.ForwardRefExoticComponent<ColorSwatchProps & React.RefAttributes<HTMLDivElement>>;
export declare const ColorSwatch: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, ColorSwatchProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(ColorSwatchProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof ColorSwatchProps> & {
    ref?: any;
}) | (ColorSwatchProps & {
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=ColorSwatch.d.ts.map