import React from 'react';
import { MantineNumberSize, DefaultProps } from '@mantine/styles';
import { OverlayStylesParams } from './Overlay.styles';
export interface OverlayProps extends DefaultProps<never, OverlayStylesParams> {
    /** Overlay opacity */
    opacity?: React.CSSProperties['opacity'];
    /** Overlay background-color */
    color?: React.CSSProperties['backgroundColor'];
    /** Overlay background blur in px */
    blur?: number;
    /** Use gradient instead of background-color */
    gradient?: string;
    /** Overlay z-index */
    zIndex?: React.CSSProperties['zIndex'];
    /** Value from theme.radius or number to set border-radius in px */
    radius?: MantineNumberSize;
}
export declare const _Overlay: React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>;
export declare const Overlay: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, OverlayProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(OverlayProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof OverlayProps> & {
    ref?: any;
}) | (OverlayProps & {
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=Overlay.d.ts.map