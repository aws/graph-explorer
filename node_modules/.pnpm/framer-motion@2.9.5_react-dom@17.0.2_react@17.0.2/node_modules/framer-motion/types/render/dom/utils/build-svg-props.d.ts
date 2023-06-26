import { SVGVisualElement } from "../SVGVisualElement";
/**
 * Build React props for SVG elements
 */
export declare function buildSVGProps(visualElement: SVGVisualElement): {
    style: {
        [x: string]: import("../../..").ResolvedSingleTarget;
    };
};
