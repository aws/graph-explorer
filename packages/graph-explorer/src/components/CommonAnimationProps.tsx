import { type MotionNodeAnimationOptions } from "motion/react";

export const addRemoveAnimationProps: MotionNodeAnimationOptions = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeInOut", when: "beforeChildren" },
};
