import { ReactNode, MutableRefObject } from "react";
declare type Registration = {
    shouldCloseWhenClickedOutside: (event: MouseEvent) => boolean;
    closeChild: () => void;
};
declare type Registrations = Set<Registration>;
declare type RegisterFn = (registration: Registration) => () => void;
declare type GroupContextType = {} | RegisterFn;
declare type GroupProviderProps = {
    children: ReactNode;
    registrations: MutableRefObject<Registrations>;
};
export declare function GroupProvider({ children, registrations }: GroupProviderProps): import("react").FunctionComponentElement<import("react").ProviderProps<GroupContextType>>;
declare type UseGroup = {
    isOpen: boolean;
    onOutsideClick?: () => void;
    onParentClose?: () => void;
};
/**
 * Responsible for close behavior
 * When the `onOutsideClick` callback is provided by the user, it will listen for clicks
 * in the document, and tell whether the user clicked outside -> not on layer / trigger.
 * It keeps track of nested useLayers a.k.a child layers (`registrations` Set), through which
 * we can ask whether they `shouldCloseWhenClickedOutside`, or tell them to close.
 *
 * Behavior:
 * - `onOutsideClick` only works on the most outer parent, and not on children. The parent will ask
 *   the child layers whether they would close, and will handle accordingly. The parent may
 *   command the children to close indirectly with the help of `onParentClose`
 * - When the parent just was closed, it will make sure that any children will also close
 *   with the help of `onParentClose`
 */
export declare function useGroup({ isOpen, onOutsideClick, onParentClose }: UseGroup): {
    closeOnOutsideClickRefs: {
        trigger: MutableRefObject<HTMLElement>;
        layer: MutableRefObject<HTMLElement>;
    };
    registrations: MutableRefObject<Registrations>;
};
export {};
