/// <reference types="react" />
import { ResizeObserverClass, ScrollOffsets, BorderOffsets } from "./types";
import { IBounds } from "./Bounds";
/**
 * Utility to get the correct ResizeObserver class
 */
export declare function getResizeObserver(environment: Window | undefined, polyfill: ResizeObserverClass | undefined): ResizeObserverClass | undefined;
/**
 * Utility function that given a element traverses up in the html-hierarchy
 * to find and return all ancestors that have scroll behavior
 */
export declare function findScrollContainers(element: HTMLElement | null, environment?: Window): HTMLElement[];
export declare type OnChangeElements = {
    layer: HTMLElement;
    trigger: HTMLElement;
    arrow: HTMLElement | null;
    scrollContainers: HTMLElement[];
};
export declare type UseTrackElementsProps = {
    enabled: boolean;
    onChange: (elements: OnChangeElements, scrollOffsets: ScrollOffsets, borderOffsets: BorderOffsets) => void;
    environment: Window | undefined;
    ResizeObserverPolyfill: ResizeObserverClass | undefined;
    overflowContainer: boolean;
    triggerOption?: {
        getBounds: () => IBounds;
        getParent?: () => HTMLElement;
    };
};
declare type UseTrackElementsReturnValue = {
    triggerRef: (element: HTMLElement | null) => void;
    layerRef: (element: HTMLElement | null) => void;
    arrowRef: React.MutableRefObject<HTMLElement | null>;
    closestScrollContainer: HTMLElement | null;
};
/**
 * This hook has the responsibility to track the bounds of:
 * - the trigger element
 * - the layer element
 * - the arrow element
 * - the scroll-containers of which the trigger element is a descendant of
 *
 * It will call the `onChange` callback with a collection of these elements when any
 * of the tracked elements bounds have changed
 *
 * It will detect these changes by listening:
 * - when the reference of the trigger element changes
 * - when the reference of the layer element changes
 * - when the trigger, layer or document body changes in size
 * - when the user scrolls the page, or any of the scroll containers
 */
export declare function useTrackElements({ enabled, onChange, environment, ResizeObserverPolyfill, overflowContainer, triggerOption }: UseTrackElementsProps): UseTrackElementsReturnValue;
export {};
