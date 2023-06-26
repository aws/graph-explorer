import React from 'react';
import { DefaultProps, MantineNumberSize } from '@mantine/styles';
import { SkeletonStylesParams } from './Skeleton.styles';
export interface SkeletonProps extends DefaultProps<never, SkeletonStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Should skeleton overlay be displayed */
    visible?: boolean;
    /** Skeleton height */
    height?: number | string;
    /** Skeleton width */
    width?: number | string;
    /** If Skeleton is a circle, it's width and border-radius will be equal to height */
    circle?: boolean;
    /** Radius from theme.radius or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Whether to show the animation effect */
    animate?: boolean;
}
export declare const Skeleton: React.ForwardRefExoticComponent<SkeletonProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Skeleton.d.ts.map