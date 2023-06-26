export declare type UseHoverOptions = {
    /**
     * Amount of milliseconds to wait while hovering before opening.
     * Default is `0`
     */
    delayEnter?: number;
    /**
     * Amount of milliseconds to wait when mouse has left the trigger before closing.
     * Default is `0`
     */
    delayLeave?: number;
    /**
     * Determines whether the layer should hide when the user starts scrolling.
     * Default is `true`
     */
    hideOnScroll?: boolean;
};
export declare type PlainCallback = (...args: any[]) => void;
export declare type UseHoverProps = {
    onMouseEnter: PlainCallback;
    onMouseLeave: PlainCallback;
    onTouchStart: PlainCallback;
    onTouchMove: PlainCallback;
    onTouchEnd: PlainCallback;
};
export declare function useHover({ delayEnter, delayLeave, hideOnScroll }?: UseHoverOptions): readonly [boolean, UseHoverProps, () => void];
