export declare type BoundSideProp = "top" | "left" | "bottom" | "right";
export declare type SideProp = BoundSideProp | "center";
declare type SizeProp = "width" | "height";
declare type CssProp = "top" | "left";
declare class SideBase<T extends SideProp> {
    readonly prop: T;
    readonly opposite: SideBase<T>;
    readonly isHorizontal: boolean;
    readonly sizeProp: SizeProp;
    readonly oppositeSizeProp: SizeProp;
    readonly cssProp: CssProp;
    readonly oppositeCssProp: CssProp;
    readonly isCenter: boolean;
    readonly isPush: boolean;
    constructor(prop: T, opposite: SideBase<T>, isHorizontal: boolean, sizeProp: SizeProp, oppositeSizeProp: SizeProp, cssProp: CssProp, oppositeCssProp: CssProp, isCenter: boolean, isPush: boolean);
    factor(value: number): number;
    isOppositeDirection(side: SideBase<any>): boolean;
}
export declare type BoundSideType = SideBase<BoundSideProp>;
export declare type SideType = SideBase<SideProp>;
export declare const BoundSide: {
    top: BoundSideType;
    bottom: BoundSideType;
    left: BoundSideType;
    right: BoundSideType;
};
export declare const Side: {
    center: SideBase<"center">;
    top: SideType;
    left: SideType;
    bottom: SideType;
    right: SideType;
};
export {};
