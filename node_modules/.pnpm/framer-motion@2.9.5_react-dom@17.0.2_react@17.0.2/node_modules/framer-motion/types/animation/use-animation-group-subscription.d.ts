import { VisualElement } from "../render/VisualElement";
import { AnimationControls } from "./AnimationControls";
/**
 * `useAnimationGroupSubscription` allows a component to subscribe to an
 * externally-created `AnimationControls`, created by the `useAnimation` hook.
 *
 * @param animation
 * @param controls
 *
 * @internal
 */
export declare function useAnimationGroupSubscription(visualElement: VisualElement, animation: AnimationControls): void;
