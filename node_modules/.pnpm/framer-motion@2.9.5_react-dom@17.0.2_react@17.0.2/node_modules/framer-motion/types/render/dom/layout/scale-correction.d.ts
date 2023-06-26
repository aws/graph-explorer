import { Point2D, Axis, AxisBox2D, BoxDelta } from "../../../types/geometry";
declare type ScaleCorrection = (latest: string | number, viewportBox: AxisBox2D, delta: BoxDelta, treeScale: Point2D) => string | number;
interface ScaleCorrectionDefinition {
    process: ScaleCorrection;
    applyTo?: string[];
}
declare type ScaleCorrectionDefinitionMap = {
    [key: string]: ScaleCorrectionDefinition;
};
export declare function pixelsToPercent(pixels: number, axis: Axis): number;
/**
 * We always correct borderRadius as a percentage rather than pixels to reduce paints.
 * For example, if you are projecting a box that is 100px wide with a 10px borderRadius
 * into a box that is 200px wide with a 20px borderRadius, that is actually a 10%
 * borderRadius in both states. If we animate between the two in pixels that will trigger
 * a paint each time. If we animate between the two in percentage we'll avoid a paint.
 */
export declare function correctBorderRadius(latest: string | number, viewportBox: AxisBox2D): string;
export declare function correctBoxShadow(latest: string, _viewportBox: AxisBox2D, delta: BoxDelta, treeScale: Point2D): string;
export declare const valueScaleCorrection: ScaleCorrectionDefinitionMap;
/**
 * @internal
 */
export declare function addScaleCorrection(correctors: ScaleCorrectionDefinitionMap): void;
export {};
