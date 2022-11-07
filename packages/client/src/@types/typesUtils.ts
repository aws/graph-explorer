import { HTMLAttributes } from "react";

// No drag events
export type MouseEventCallbackName =
  | "onClick"
  | "onMouseUp"
  | "onMouseMove"
  | "onMouseEnter"
  | "onMouseDown"
  | "onMouseLeave"
  | "onMouseOut"
  | "onMouseOver"
  | "onContextMenu";

export type MouseEventCallback = Pick<
  HTMLAttributes<HTMLElement>,
  MouseEventCallbackName
>;
