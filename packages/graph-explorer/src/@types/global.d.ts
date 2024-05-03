import "react";

/*
 * The latest React type definitions removed some events that never actually existed.
 * But some libraries have depended on these events through their own type definitions.
 * So we must add these back in to satisfy the types.
 *
 * The only offender I know of is react-laag, which is for our tooltips.
 *
 * Refer to this discussion:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69006#discussioncomment-8874434
 */

declare module "react" {
  interface HTMLAttributes<T> {
    onPointerEnterCapture?: (e: React.PointerEvent<T>) => void;
    onPointerLeaveCapture?: (e: React.PointerEvent<T>) => void;
  }
  interface RefAttributes<T> {
    onPointerEnterCapture?: (e: React.PointerEvent<T>) => void;
    onPointerLeaveCapture?: (e: React.PointerEvent<T>) => void;
  }
}
