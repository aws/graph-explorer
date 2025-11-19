import type { Activity, ComponentProps } from "react";

/**
 * Returns the mode for the Activity component based on the condition.
 * @param condition - The condition to check.
 * @returns The mode for the Activity component.
 */
export function isVisible(
  condition: boolean,
): ComponentProps<typeof Activity>["mode"] {
  return condition ? "visible" : "hidden";
}
