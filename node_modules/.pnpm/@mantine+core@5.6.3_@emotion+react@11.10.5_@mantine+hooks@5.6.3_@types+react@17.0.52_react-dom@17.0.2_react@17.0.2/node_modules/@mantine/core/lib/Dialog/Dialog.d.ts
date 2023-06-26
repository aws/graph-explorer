import React from 'react';
import { DefaultProps, Selectors, MantineStyleSystemSize } from '@mantine/styles';
import { MantineTransition } from '../Transition';
import { PaperProps } from '../Paper';
import useStyles, { DialogStylesParams } from './Dialog.styles';
export declare type DialogStylesNames = Selectors<typeof useStyles>;
export interface DialogProps extends Omit<DefaultProps<DialogStylesNames, DialogStylesParams>, MantineStyleSystemSize>, Omit<PaperProps, 'classNames' | 'styles'> {
    /** Display close button at the top right corner */
    withCloseButton?: boolean;
    /** Called when close button is clicked */
    onClose?(): void;
    /** Dialog position (fixed in viewport) */
    position?: {
        top?: string | number;
        left?: string | number;
        bottom?: string | number;
        right?: string | number;
    };
    /** Dialog content */
    children?: React.ReactNode;
    /** Dialog container z-index */
    zIndex?: React.CSSProperties['zIndex'];
    /** Opened state */
    opened: boolean;
    /** Appear/disappear transition */
    transition?: MantineTransition;
    /** Duration in ms of modal transitions, set to 0 to disable all animations */
    transitionDuration?: number;
    /** Transition timing function, defaults to theme.transitionTimingFunction */
    transitionTimingFunction?: string;
    /** Predefined dialog width or number to set width in px */
    size?: string | number;
}
export declare function DialogBody(props: DialogProps): JSX.Element;
export declare const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Dialog.d.ts.map