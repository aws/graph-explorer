import React from 'react';
import { DefaultProps, MantineGradient, MantineColor, MantineNumberSize } from '@mantine/styles';
export interface TextProps extends DefaultProps {
    /** Text content */
    children?: React.ReactNode;
    /** Key of theme.fontSizes or number to set font-size in px */
    size?: MantineNumberSize;
    /** Key of theme.colors or any valid CSS color */
    color?: 'dimmed' | MantineColor;
    /** Sets font-weight css property */
    weight?: React.CSSProperties['fontWeight'];
    /** Sets text-transform css property */
    transform?: React.CSSProperties['textTransform'];
    /** Sets text-align css property */
    align?: React.CSSProperties['textAlign'];
    /** Link or text variant */
    variant?: 'text' | 'link' | 'gradient';
    /** CSS -webkit-line-clamp property */
    lineClamp?: number;
    /** Sets line-height to 1 for centering */
    inline?: boolean;
    /** Underline the text */
    underline?: boolean;
    /** Add strikethrough styles */
    strikethrough?: boolean;
    /** Adds font-style: italic style */
    italic?: boolean;
    /** Inherit font properties from parent element */
    inherit?: boolean;
    /** Controls gradient settings in gradient variant only */
    gradient?: MantineGradient;
    /** Shorthand for component="span" */
    span?: boolean;
}
export declare const _Text: React.ForwardRefExoticComponent<TextProps & React.RefAttributes<HTMLDivElement>>;
export declare const Text: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, TextProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(TextProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof TextProps> & {
    ref?: any;
}) | (TextProps & {
    /** Inherit font properties from parent element */
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=Text.d.ts.map