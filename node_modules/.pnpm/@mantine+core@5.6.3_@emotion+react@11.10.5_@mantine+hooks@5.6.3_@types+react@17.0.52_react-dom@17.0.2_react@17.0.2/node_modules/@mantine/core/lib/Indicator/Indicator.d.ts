import React from 'react';
import { Selectors, DefaultProps, MantineColor, MantineNumberSize } from '@mantine/styles';
import { IndicatorPosition } from './Indicator.types';
import useStyles, { IndicatorStylesParams } from './Indicator.styles';
export declare type IndicatorStylesNames = Selectors<typeof useStyles>;
export interface IndicatorProps extends DefaultProps<IndicatorStylesNames, IndicatorStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** Element that should have an indicator */
    children: React.ReactNode;
    /** Indicator position relative to child element */
    position?: IndicatorPosition;
    /** Changes position offset, usually used when element has border-radius */
    offset?: number;
    /** Determines whether indicator container should be an inline element */
    inline?: boolean;
    /** Size in px */
    size?: number;
    /** Indicator label */
    label?: React.ReactNode;
    /** Indicator count overflowCount */
    overflowCount?: number;
    dot?: boolean;
    /** border-radius from theme.radius or number value to set radius in px */
    radius?: MantineNumberSize;
    /** Color from theme.colors or any other valid CSS color value */
    color?: MantineColor;
    /** Determines whether indicator should have border */
    withBorder?: boolean;
    /** When component is disabled it renders children without indicator */
    disabled?: boolean;
    /** When showZero is true and label is zero  renders children with indicator*/
    showZero?: boolean;
    /** Indicator processing animation */
    processing?: boolean;
    /** Indicator z-index */
    zIndex?: React.CSSProperties['zIndex'];
}
export declare const Indicator: React.ForwardRefExoticComponent<IndicatorProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Indicator.d.ts.map