import { Bounds, IBounds } from "./Bounds";
interface ISubjectsBounds {
    trigger: IBounds;
    layer: IBounds;
    arrow: IBounds;
    parent: IBounds;
    window: IBounds;
    scrollContainers: IBounds[];
}
export declare class SubjectsBounds implements ISubjectsBounds {
    private readonly overflowContainer;
    readonly trigger: Bounds;
    readonly layer: Bounds;
    readonly arrow: Bounds;
    readonly parent: Bounds;
    readonly window: Bounds;
    readonly scrollContainers: Bounds[];
    private constructor();
    static create(environment: Window, layer: HTMLElement, trigger: HTMLElement, parent: HTMLElement | undefined, arrow: HTMLElement | null, scrollContainers: HTMLElement[], overflowContainer: boolean, getTriggerBounds?: () => IBounds): SubjectsBounds;
    merge(subjectsBounds: Partial<ISubjectsBounds>): SubjectsBounds;
    get layerOffsetsToScrollContainers(): import("./BoundsOffsets").BoundsOffsets[];
    get triggerHasBiggerWidth(): boolean;
    get triggerHasBiggerHeight(): boolean;
    offsetsToScrollContainers(subject: Bounds, allContainers?: boolean): import("./BoundsOffsets").BoundsOffsets[];
}
export {};
