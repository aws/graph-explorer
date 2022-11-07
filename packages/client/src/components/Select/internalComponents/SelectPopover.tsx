import { FocusScope } from "@react-aria/focus";
import { DismissButton, useOverlay } from "@react-aria/overlays";
import type { CSSProperties, ForwardedRef, RefObject } from "react";
import { forwardRef } from "react";
import type { Styles } from "react-laag/dist/types";
import { useWithTheme } from "../../../core";
import popoverStyles from "../Select.styles";

interface PopoverProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  style?: Styles["layer"];
  menuStyleOverride?: CSSProperties;
}

const SelectPopover = (
  props: PopoverProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const { onClose, children, style, menuStyleOverride } = props;
  const styleWithTheme = useWithTheme();

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
        className={styleWithTheme(popoverStyles.popoverWrapperStyles)}
        {...overlayProps}
        style={{ ...style, ...menuStyleOverride }}
        ref={ref}
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
};

export default forwardRef<HTMLDivElement, PopoverProps>(SelectPopover);
