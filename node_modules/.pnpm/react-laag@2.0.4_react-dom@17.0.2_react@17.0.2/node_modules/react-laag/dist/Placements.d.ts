import { BoundSideType, SideType, SideProp } from "./Sides";
import { PlacementType } from "./PlacementType";
import { Placement } from "./Placement";
import { SubjectsBounds } from "./SubjectsBounds";
import { PositionConfig, ScrollOffsets, BorderOffsets, DisappearType, Styles } from "./types";
import { Bounds } from "./Bounds";
/**
 * Class mostly concerned about calculating and finding the right placement
 */
export declare class Placements {
    readonly placements: Placement[];
    private config;
    private subjectsBounds;
    protected constructor(placements: Placement[], config: PositionConfig, subjectsBounds: SubjectsBounds);
    /**
     * Converts a placement-type into a primary-side and a secondary-side
     */
    static getSidesFromPlacementType(type: PlacementType): [BoundSideType, SideType];
    /**
     * Main static method to create a Placements instance
     * @param subjectsBounds instance of the SubjectsBounds class
     * @param config config provided by the user
     */
    static create(subjectsBounds: SubjectsBounds, config: PositionConfig): Placements;
    private filterPlacementsBySide;
    private findFirstPlacementThatFits;
    private placementWithBiggestVisibleSurface;
    private findSuitablePlacement;
    /**
     * secondary offset: the number of pixels between the edge of the
     * scroll-container and the current placement, on the side of the layer
     * that didn't fit.
     * Eventually this secondary offset gets added / subtracted from the
     * placement that does fit in order to move the layer closer to the
     * position of the placement that just would not fit.
     * This creates the effect that the layer is moving gradually from one
     * placement to the next as the users scrolls the page or scroll-container
     */
    private getSecondaryOffset;
    private getStyles;
    private getHasDisappeared;
    result(scrollOffsets: ScrollOffsets, borderOffsets: BorderOffsets): {
        styles: Styles;
        layerSide: SideProp;
        placement: Placement;
        layerBounds: Bounds;
        hasDisappeared: DisappearType | null;
    };
}
