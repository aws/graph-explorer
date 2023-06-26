import React from 'react';
import { DefaultProps, MantineColor, MantineNumberSize } from '@mantine/styles';
import { ForwardRefWithStaticComponents } from '@mantine/utils';
import { TimelineItem, TimelineItemStylesNames } from './TimelineItem/TimelineItem';
export interface TimelineProps extends DefaultProps<TimelineItemStylesNames>, React.ComponentPropsWithRef<'div'> {
    /** <Timeline.Item /> components only */
    children: React.ReactNode;
    /** Index of active element */
    active?: number;
    /** Active color from theme */
    color?: MantineColor;
    /** Radius from theme.radius, or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Bullet size in px */
    bulletSize?: number;
    /** Timeline alignment */
    align?: 'right' | 'left';
    /** Line width in px */
    lineWidth?: number;
    /** Reverse active direction without reversing items */
    reverseActive?: boolean;
}
declare type TimelineComponent = ForwardRefWithStaticComponents<TimelineProps, {
    Item: typeof TimelineItem;
}>;
export declare const Timeline: TimelineComponent;
export {};
//# sourceMappingURL=Timeline.d.ts.map