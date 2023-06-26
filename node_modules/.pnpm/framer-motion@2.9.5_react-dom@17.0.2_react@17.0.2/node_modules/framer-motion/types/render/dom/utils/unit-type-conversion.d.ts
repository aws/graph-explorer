import { Target, TargetWithKeyframes } from "../../../types";
import { HTMLVisualElement } from "../HTMLVisualElement";
export declare enum BoundingBoxDimension {
    width = "width",
    height = "height",
    left = "left",
    right = "right",
    top = "top",
    bottom = "bottom"
}
/**
 * Convert value types for x/y/width/height/top/left/bottom/right
 *
 * Allows animation between `'auto'` -> `'100%'` or `0` -> `'calc(50% - 10vw)'`
 *
 * @internal
 */
export declare function unitConversion(visualElement: HTMLVisualElement, target: TargetWithKeyframes, origin?: Target, transitionEnd?: Target): {
    target: TargetWithKeyframes;
    transitionEnd?: Target;
};
