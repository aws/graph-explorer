import { Dimensions, TransformOrigin, DOMVisualElementConfig } from "../types";
import { ResolvedValues } from "../../VisualElement/types";
import { BoxDelta, Point2D, AxisBox2D } from "../../../types/geometry";
/**
 * Build SVG visual attrbutes, like cx and style.transform
 */
export declare function buildSVGAttrs({ attrX, attrY, originX, originY, pathLength, pathSpacing, pathOffset, ...latest }: ResolvedValues, style: ResolvedValues, vars: ResolvedValues, attrs: ResolvedValues, transform: ResolvedValues, transformOrigin: TransformOrigin, transformKeys: string[], config: DOMVisualElementConfig, dimensions: Dimensions, totalPathLength: number, isLayoutProjectionEnabled?: boolean, delta?: BoxDelta, deltaFinal?: BoxDelta, treeScale?: Point2D, targetBox?: AxisBox2D): ResolvedValues;
