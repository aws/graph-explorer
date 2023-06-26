import React from 'react';
import { DefaultProps, MantineNumberSize, MantineShadow, Selectors, MantineStyleSystemSize } from '@mantine/styles';
import { MantineTransition } from '../Transition';
import useStyles, { ModalStylesParams } from './Modal.styles';
export declare type ModalStylesNames = Selectors<typeof useStyles>;
export interface ModalProps extends Omit<DefaultProps<ModalStylesNames, ModalStylesParams>, MantineStyleSystemSize>, Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
    /** Mounts modal if true */
    opened: boolean;
    /** Called when close button clicked and when escape key is pressed */
    onClose(): void;
    /** Modal title, displayed in header before close button */
    title?: React.ReactNode;
    /** Modal z-index property */
    zIndex?: React.CSSProperties['zIndex'];
    /** Control vertical overflow behavior */
    overflow?: 'outside' | 'inside';
    /** Hides close button if set to false, modal still can be closed with escape key and by clicking outside */
    withCloseButton?: boolean;
    /** Overlay opacity */
    overlayOpacity?: number;
    /** Overlay color */
    overlayColor?: string;
    /** Overlay blur in px */
    overlayBlur?: number;
    /** Determines whether the modal should take the entire screen */
    fullScreen?: boolean;
    /** Modal radius */
    radius?: MantineNumberSize;
    /** Modal body width */
    size?: string | number;
    /** Modal body transition */
    transition?: MantineTransition;
    /** Duration in ms of modal transitions, set to 0 to disable all animations */
    transitionDuration?: number;
    /** Exit transition duration in ms, 0 by default */
    exitTransitionDuration?: number;
    /** Modal body transitionTimingFunction, defaults to theme.transitionTimingFunction */
    transitionTimingFunction?: string;
    /** Close button aria-label */
    closeButtonLabel?: string;
    /** id base, used to generate ids to connect modal title and body with aria- attributes, defaults to random id */
    id?: string;
    /** Modal shadow from theme or css value */
    shadow?: MantineShadow;
    /** Modal padding from theme or number value for padding in px */
    padding?: MantineNumberSize;
    /** Should modal be closed when outside click was registered? */
    closeOnClickOutside?: boolean;
    /** Should modal be closed when escape is pressed? */
    closeOnEscape?: boolean;
    /** Disables focus trap */
    trapFocus?: boolean;
    /** Controls if modal should be centered */
    centered?: boolean;
    /** Determines whether scroll should be locked when modal is opened, defaults to true */
    lockScroll?: boolean;
    /** Target element or selector where modal portal should be rendered */
    target?: HTMLElement | string;
    /** Determines whether modal should be rendered within Portal, defaults to true */
    withinPortal?: boolean;
    /** Determines whether focus should be returned to the last active element when drawer is closed */
    withFocusReturn?: boolean;
}
export declare function Modal(props: ModalProps): JSX.Element;
export declare namespace Modal {
    var displayName: string;
}
//# sourceMappingURL=Modal.d.ts.map