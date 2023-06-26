/**
 * Convert a pixel value into a numeric value
 * @param value string value (ie. '12px')
 */
export declare function getPixelValue(value: string): number;
/**
 * Returns a numeric value that doesn't exceed min or max
 */
export declare function limit(value: number, min: number, max: number): number;
/**
 * Utility function which ensures whether a value is truthy
 */
export declare function isSet<T>(value: T | null | undefined): value is T;
/**
 * Utility function that let's you assign multiple references to a 'ref' prop
 * @param refs list of MutableRefObject's and / or callbacks
 */
export declare function mergeRefs(...refs: any[]): (element: HTMLElement | null) => void;
