import React from 'react';
import { DefaultProps, MantineNumberSize } from '@mantine/styles';
export interface BackgroundImageProps extends DefaultProps, React.ComponentPropsWithoutRef<'div'> {
    /** Image url */
    src: string;
    /** Key of theme.radius or number to set border-radius in px */
    radius?: MantineNumberSize;
}
export declare const _BackgroundImage: React.ForwardRefExoticComponent<BackgroundImageProps & React.RefAttributes<HTMLDivElement>>;
export declare const BackgroundImage: (<C = "div">(props: import("@mantine/utils").PolymorphicComponentProps<C, BackgroundImageProps>) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) & Omit<React.FunctionComponent<(BackgroundImageProps & {
    component?: any;
} & Omit<Pick<any, string | number | symbol>, "component" | keyof BackgroundImageProps> & {
    ref?: any;
}) | (BackgroundImageProps & {
    component: React.ElementType<any>;
})>, never> & Record<string, never>;
//# sourceMappingURL=BackgroundImage.d.ts.map