export interface IBoundsOffsets {
    top: number;
    left: number;
    right: number;
    bottom: number;
}
/**
 * A class containing the positional properties which represent the distance
 * between two Bounds instances for each side
 */
export declare class BoundsOffsets implements IBoundsOffsets {
    top: number;
    left: number;
    right: number;
    bottom: number;
    constructor(offsets: IBoundsOffsets);
    /**
     * Takes multiple BoundsOffets instances and creates a new BoundsOffsets instance
     * by taking the smallest value for each side
     * @param boundsOffsets list of BoundsOffsets instances
     */
    static mergeSmallestSides(boundsOffsets: BoundsOffsets[]): BoundsOffsets;
    /**
     * Checks whether all sides sides are positive, meaning the corresponding Bounds instance
     * fits perfectly within a parent Bounds instance
     */
    get allSidesArePositive(): boolean;
    /**
     * Returns a partial IBoundsOffsets with sides that are negative, meaning sides aren't entirely
     * visible in respect to a parent Bounds instance
     */
    get negativeSides(): Partial<IBoundsOffsets>;
}
