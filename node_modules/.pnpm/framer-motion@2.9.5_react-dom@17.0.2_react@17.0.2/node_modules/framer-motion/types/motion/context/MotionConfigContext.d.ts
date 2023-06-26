import * as React from "react";
import { MotionFeature } from "../features/types";
import { TransformPoint2D } from "../../types/geometry";
/**
 * @public
 */
export interface MotionConfigContext {
    /**
     * @internal
     */
    transformPagePoint: TransformPoint2D;
    /**
     * An array of features to provide to children.
     *
     * @public
     */
    features: MotionFeature[];
    /**
     * Determines whether this is a static context ie the Framer canvas. If so,
     * it'll disable all dynamic functionality.
     *
     * @internal
     */
    isStatic: boolean;
}
export interface MotionConfigProps extends Partial<MotionConfigContext> {
    children?: React.ReactNode;
}
/**
 * @public
 */
export declare const MotionConfigContext: React.Context<MotionConfigContext>;
/**
 * MotionConfig can be used in combination with the `m` component to cut bundle size
 * and dynamically load only the features you use.
 *
 * ```jsx
 * import {
 *   m as motion,
 *   AnimationFeature,
 *   MotionConfig
 * } from "framer-motion"
 *
 * export function App() {
 *   return (
 *     <MotionConfig features={[AnimationFeature]}>
 *       <motion.div animate={{ x: 100 }} />
 *     </MotionConfig>
 *   )
 * }
 * ```
 *
 * @public
 */
export declare function MotionConfig({ children, features, ...props }: MotionConfigProps): JSX.Element;
