import { useDialog } from "@react-aria/dialog";
import { FocusScope } from "@react-aria/focus";
import { DismissButton, useModal, useOverlay } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";
import { CSSProperties, forwardRef, ReactNode, RefObject } from "react";

type DatePickerPopoverProps = {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  style?: CSSProperties;
};

// eslint-disable-next-line react/display-name
const DatePickerPopover = forwardRef<HTMLDivElement, DatePickerPopoverProps>(
  ({ children, isOpen, onClose, style, ...otherProps }, ref) => {
    const { overlayProps } = useOverlay(
      {
        onClose,
        isOpen,
        isDismissable: true,
      },
      ref as RefObject<HTMLDivElement>
    );

    // Hide content outside the modal from screen readers.
    const { modalProps } = useModal();

    // Get props for the dialog and its title
    const { dialogProps } = useDialog({}, ref as RefObject<HTMLDivElement>);

    return (
      <FocusScope autoFocus>
        <div
          {...mergeProps(overlayProps, dialogProps, otherProps, modalProps)}
          ref={ref}
          style={{ ...style, zIndex: 999999999 }}
        >
          {children}
          <DismissButton onDismiss={onClose} />
        </div>
      </FocusScope>
    );
  }
);

export default DatePickerPopover;
