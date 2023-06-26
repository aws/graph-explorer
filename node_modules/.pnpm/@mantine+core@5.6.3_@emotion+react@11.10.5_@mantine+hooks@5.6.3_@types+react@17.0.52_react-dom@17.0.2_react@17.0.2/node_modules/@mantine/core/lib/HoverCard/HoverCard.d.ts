import React from 'react';
import { PopoverBaseProps } from '../Popover';
import { HoverCardDropdown } from './HoverCardDropdown/HoverCardDropdown';
export interface HoverCardProps extends PopoverBaseProps {
    /** HoverCard.Target and HoverCard.Dropdown components */
    children?: React.ReactNode;
    /** Initial opened state */
    initiallyOpened?: boolean;
    /** Called when dropdown is opened */
    onOpen?(): void;
    /** Called when dropdown is closed */
    onClose?(): void;
    /** Open delay in ms */
    openDelay?: number;
    /** Close delay in ms */
    closeDelay?: number;
}
export declare function HoverCard(props: HoverCardProps): JSX.Element;
export declare namespace HoverCard {
    var displayName: string;
    var Target: React.ForwardRefExoticComponent<import("./HoverCardTarget/HoverCardTarget").HoverCardTargetProps & React.RefAttributes<HTMLElement>>;
    var Dropdown: typeof HoverCardDropdown;
}
//# sourceMappingURL=HoverCard.d.ts.map