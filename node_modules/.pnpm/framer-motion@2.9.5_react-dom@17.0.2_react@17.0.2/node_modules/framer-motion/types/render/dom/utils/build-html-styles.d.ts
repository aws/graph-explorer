import { ResolvedValues } from "../../VisualElement/types";
import { DOMVisualElementConfig, TransformOrigin } from "../types";
import { Point2D, AxisBox2D, BoxDelta } from "../../../types/geometry";
/**
 * Build style and CSS variables
 *
 * This function converts a Motion style prop:
 *
 * { x: 100, width: 100, originX: 0.5 }
 *
 * Into an object with default value types applied and default
 * transform order set:
 *
 * {
 *   transform: 'translateX(100px) translateZ(0)`,
 *   width: '100px',
 *   transformOrigin: '50% 50%'
 * }
 *
 * Styles are saved to `style` and CSS vars to `vars`.
 *
 * This function works with mutative data structures.
 */
export declare function buildHTMLStyles(latest: ResolvedValues, style: ResolvedValues, vars: ResolvedValues, transform: ResolvedValues, transformOrigin: TransformOrigin, transformKeys: string[], { enableHardwareAcceleration, transformTemplate, allowTransformNone, }: DOMVisualElementConfig, isLayoutProjectionEnabled?: boolean, delta?: BoxDelta, deltaFinal?: BoxDelta, treeScale?: Point2D, targetBox?: AxisBox2D): void;
