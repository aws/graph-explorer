/// <reference types="react" />
export declare type TransitionProps = {
    isOpen: boolean;
    children: (isOpen: boolean, onTransitionEnd: any, isLeaving: boolean) => React.ReactElement;
};
/**
 * @deprecated
 * Note: this component is marked as deprecated and will be removed and a possible
 * future release
 */
export declare function Transition({ isOpen: isOpenExternal, children }: TransitionProps): import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | null;
