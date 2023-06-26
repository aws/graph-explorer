import { VisualElement } from "../../render/VisualElement";
import { MotionProps } from "../types";
/**
 * Scrape props for MotionValues and add/remove them to this component's
 * VisualElement
 */
export declare function useMotionValues<P>(visualElement: VisualElement<any>, props: P & MotionProps): void;
