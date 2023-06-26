import React from 'react';
import { DefaultProps, MantineStyleSystemSize } from '@mantine/styles';
export interface AffixProps extends Omit<DefaultProps, MantineStyleSystemSize>, React.ComponentPropsWithoutRef<'div'> {
    /** Element where portal should be rendered, by default new div element is created and appended to document.body */
    target?: HTMLDivElement;
    /** Root element z-index property */
    zIndex?: React.CSSProperties['zIndex'];
    /** Determines whether component should be rendered within portal, defaults to true */
    withinPortal?: boolean;
    /** Fixed position in px, defaults to { bottom: 0, right: 0 } */
    position?: {
        top?: string | number;
        left?: string | number;
        bottom?: string | number;
        right?: string | number;
    };
}
export declare const Affix: React.ForwardRefExoticComponent<AffixProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Affix.d.ts.map