import { FocusScope } from "@react-aria/focus";
import { DismissButton, useOverlay } from "@react-aria/overlays";
import type { ForwardedRef, RefObject } from "react";
import { forwardRef } from "react";
import type { Styles } from "react-laag/dist/types";
import { cn } from "@/utils";

interface PopoverProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  style?: Styles["layer"];
}

const SelectPopover = (
  props: PopoverProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const { onClose, children, style } = props;

  // Handle events that should cause the popup to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  const { overlayProps } = useOverlay(
    {
      isOpen: true,
      onClose,
      shouldCloseOnBlur: true,
      isDismissable: false,
    },
    ref as RefObject<HTMLDivElement>
  );
  // Add a hidden <DismissButton> component at the end of the popover
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope autoFocus>
      <div
        className={cn(
          "z-menu bg-background-default absolute w-full rounded-md border shadow-md"
        )}
        {...overlayProps}
        style={style}
        ref={ref}
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
};

export default forwardRef<HTMLDivElement, PopoverProps>(SelectPopover);
