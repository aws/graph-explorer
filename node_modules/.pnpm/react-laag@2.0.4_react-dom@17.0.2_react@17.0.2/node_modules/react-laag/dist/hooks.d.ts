import { useLayoutEffect, MutableRefObject, MouseEvent } from "react";
import { IBounds } from "./Bounds";
/**
 * Utility hook to track the reference of a html-element.
 * It notifies the listener when a change occured, so it can act
 * on the change
 */
export declare function useTrackRef(onRefChange: (element: HTMLElement) => void): (node: HTMLElement | null) => void;
/**
 * Utility hook that stores mutable state.
 * Since a getter function is used, it will always return the most
 * up-to-date state. This is useful when you want to get certain state within
 * an effect, without triggering the same effect when the same state changes.
 * Note: may be seen as an anti-pattern.
 */
export declare function useMutableStore<State>(initialState: State): readonly [
    () => State,
    {
        (setter: (state: State) => State): void;
        (setter: State): void;
    }
];
/**
 * Utility hook that keeps track of active event listeners and how
 * to remove these listeners
 */
export declare function useEventSubscriptions(): {
    hasEventSubscriptions: () => boolean;
    removeAllEventSubscriptions: () => void;
    addEventSubscription: (unsubscriber: () => void) => void;
};
/**
 * SSR-safe effect hook
 */
export declare const useIsomorphicLayoutEffect: typeof useLayoutEffect;
/**
 * Utility hook that tracks an state object.
 * If `enabled=false` it will discard changes and reset the lastState to `null`
 */
export declare function useLastState<T extends unknown>(currentState: T, enabled: boolean): MutableRefObject<T | null>;
export declare type UseMousePositionAsTriggerOptions = {
    /**
     * @description Should the position be actively tracked?
     * @default true
     */
    enabled?: boolean;
    /**
     * @description Should `handleMouseEvent` preventDefault()?
     * @default true
     */
    preventDefault?: boolean;
};
export declare type UseMousePositionAsTriggerProps = {
    hasMousePosition: boolean;
    resetMousePosition: () => void;
    handleMouseEvent: (evt: MouseEvent) => void;
    trigger: {
        getBounds: () => IBounds;
        getParent?: () => HTMLElement;
    };
    parentRef: MutableRefObject<any>;
};
/**
 * @description Utility hook that lets you use the mouse-position as source of the trigger.
 * This is useful in scenario's like context-menu's.
 *
 * @example
 * ```tsx
 * const {
 *  hasMousePosition,
 *  resetMousePosition,
 *  handleMouseEvent,
 *  trigger
 *  } = useMousePositionAsTrigger();
 *
 * const { renderLayer, layerProps } = useLayer({
 *  isOpen: hasMousePosition,
 *  trigger,
 *  onOutsideClick: resetMousePosition
 * });
 *
 * return (
 *  <>
 *   {isOpen && renderLayer(<div {...layerProps} />)}
 *   <div onContextMenu={handleMouseEvent} />
 *  </>
 * );
 * ```
 */
export declare function useMousePositionAsTrigger({ enabled, preventDefault }?: UseMousePositionAsTriggerOptions): UseMousePositionAsTriggerProps;
