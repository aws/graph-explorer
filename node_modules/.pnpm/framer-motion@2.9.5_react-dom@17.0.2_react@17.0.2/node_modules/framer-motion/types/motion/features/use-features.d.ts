/// <reference types="react" />
import { VisualElement } from "../../render/VisualElement";
import { MotionProps } from "..";
import { MotionFeature } from "./types";
/**
 * Load features via renderless components based on the provided MotionProps
 */
export declare function useFeatures(defaultFeatures: MotionFeature[], isStatic: boolean, visualElement: VisualElement, props: MotionProps): null | JSX.Element[];
