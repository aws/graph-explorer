import { BoundSideType, SideType } from "./Sides";
import { PlacementType } from "./PlacementType";
import { SubjectsBounds } from "./SubjectsBounds";
import { PositionConfig, Offsets } from "./types";
import { Bounds } from "./Bounds";
import { BoundsOffsets } from "./BoundsOffsets";
/**
 * Class for various calculations based on a placement-type. I.e 'top-left';
 */
export declare class Placement {
    readonly primary: SideType;
    readonly secondary: SideType;
    private readonly offsets;
    protected subjectsBounds: SubjectsBounds;
    private _cachedLayerBounds;
    private _cachedContainerOffsets;
    constructor(primary: SideType, secondary: SideType, subjectBounds: SubjectsBounds, layerDimensions: PositionConfig["layerDimensions"], offsets: Offsets);
    /**
     * Set subjectsBounds that are specific for this placement
     * @param subjectBounds original SubjectBounds instance
     * @param layerDimensions possible config prodvided by the user
     */
    private setSubjectsBounds;
    /**
     * Returns the string respresentation of this placement (ie. 'top-start')
     */
    get type(): PlacementType;
    /**
     * Calculates the actual boundaries based on the placement
     * @param secondaryOffset optional offset on the secondary-side
     */
    getLayerBounds(secondaryOffset?: number): Bounds;
    /**
     * Checks whether the trigger is bigger on the opposite side
     * ie. placement "top-start" -> has trigger a bigger width?
     */
    get triggerIsBigger(): boolean;
    /**
     * Checks whether the placement fits within all it's container (including container-offset)
     */
    get fitsContainer(): boolean;
    /**
     * Returns the surface in square pixels of the visible part of the layer
     */
    get visibleSurface(): number;
    /**
     * Returns a BoundSide by looking at the most negative offset that is the opposite direction
     */
    get secondaryOffsetSide(): BoundSideType | null;
    /**
     * returns getLayerBounds(), including container-offsets
     */
    private getLayerCollisionBounds;
    /**
     * Returns a BoundsOffsets instance containing merged offsets to containers with the most
     * negative scenario
     */
    getContainerOffsets(layerBounds?: Bounds): BoundsOffsets;
}
export declare class PlacementCenter extends Placement {
    getLayerBounds(): Bounds;
}
