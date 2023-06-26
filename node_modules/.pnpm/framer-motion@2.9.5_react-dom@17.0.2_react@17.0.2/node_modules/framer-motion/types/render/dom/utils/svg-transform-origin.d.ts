import { Dimensions } from "../types";
/**
 * The SVG transform origin defaults are different to CSS and is less intuitive,
 * so we use the measured dimensions of the SVG to reconcile these.
 */
export declare function calcSVGTransformOrigin(dimensions: Dimensions, originX: number | string, originY: number | string): string;
