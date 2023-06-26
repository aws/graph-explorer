import React from 'react';
import { MantineTransition } from './transitions';
interface GroupedTransitionItem {
    duration: number;
    timingFunction?: React.CSSProperties['transitionTimingFunction'];
    transition: MantineTransition;
}
export interface GroupedTransitionProps {
    /** Transitions group */
    transitions: Record<string, GroupedTransitionItem>;
    /** Render function with transition group styles argument */
    children(styles: Record<string, React.CSSProperties>): React.ReactElement<any, any>;
    /** Enter transition duration in ms */
    duration?: number;
    /** Exit transition duration in ms */
    exitDuration?: number;
    /** Transition timing function, defaults to theme.transitionTimingFunction */
    timingFunction?: string;
    /** When true, component will be mounted */
    mounted: boolean;
    /** Calls when exit transition ends */
    onExited?: () => void;
    /** Calls when exit transition starts */
    onExit?: () => void;
    /** Calls when enter transition starts */
    onEnter?: () => void;
    /** Calls when enter transition ends */
    onEntered?: () => void;
}
export declare function GroupedTransition({ transitions, duration, exitDuration, mounted, children, timingFunction, onExit, onEntered, onEnter, onExited, }: GroupedTransitionProps): JSX.Element;
export declare namespace GroupedTransition {
    var displayName: string;
}
export {};
//# sourceMappingURL=GroupedTransition.d.ts.map