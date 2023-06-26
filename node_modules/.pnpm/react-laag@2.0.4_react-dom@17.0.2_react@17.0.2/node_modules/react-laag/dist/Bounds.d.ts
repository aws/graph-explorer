import { BoundSideType } from "./Sides";
import { BoundsOffsets } from "./BoundsOffsets";
export interface IBounds {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
export declare function boundsToObject({ top, left, right, bottom, width, height }: IBounds): IBounds;
/**
 * A class containing the positional properties of the native DOM's ClientRect
 * (`element.getBoundingClientRect()`), together with some utility methods
 */
export declare class Bounds implements IBounds {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    /**
     * Creates a new Bounds class
     * @param bounds An object that adheres to the `IBounds` interface
     */
    static create(bounds: IBounds): Bounds;
    /**
     * Creates a new Bounds class from a DOM-element
     * @param element reference to the DOM-element
     * @param options optional options object
     */
    static fromElement(element: HTMLElement, options?: {
        /** should transforms like 'scale' taken into account? Defaults to `true` */
        withTransform?: boolean;
        /** reference to the window-object (needed when working with iframes for instance). Defaults to `window` */
        environment?: Window;
        /** should the elements scrollbars be included? Defaults to `true` */
        withScrollbars?: boolean;
    }): Bounds;
    /**
     * Creates an empty Bounds class
     */
    static empty(): Bounds;
    /**
     * Creates a Bounds class from the window's dimensions
     * @param environment reference to the window-object (needed when working with iframes for instance). Defaults to `window`
     */
    static fromWindow(environment?: Window): Bounds;
    protected constructor(bounds?: Partial<IBounds>);
    /**
     * Returns the square surface of the bounds in pixels
     */
    get surface(): number;
    /**
     * Returns a plain object containing only positional properties
     */
    toObject(): IBounds;
    /**
     * Returns a new Bounds instance by merging two bounds
     * @param bounds partial bounds which should be merged
     */
    merge(bounds: Partial<IBounds>): Bounds;
    /**
     * Returns a new Bounds instance by merging two bounds
     * @param mergeFn callback which takes the current bounds and returns new merged bounds
     */
    merge(mergeFn: (current: IBounds) => Partial<IBounds>): Bounds;
    /**
     * Return a new Bounds instance by subtracting each property of the provided IBounds object
     * @param bounds partial IBounds object to substract with
     */
    substract(bounds: Partial<IBounds>): Bounds;
    /**
     * Returns a new BoundsOffsets instance by determining the distance for each bound-side:
     * (child -> parent)
     * @param child child bounds instance
     */
    offsetsTo(child: Bounds): BoundsOffsets;
    /**
     * Return a new Bounds instance by mapping over each bound-side
     * @param mapper callback that takes a boundSide + value in pixels, returning a new value for that side
     */
    mapSides(mapper: (boundSide: BoundSideType, value: number) => number): Bounds;
}
