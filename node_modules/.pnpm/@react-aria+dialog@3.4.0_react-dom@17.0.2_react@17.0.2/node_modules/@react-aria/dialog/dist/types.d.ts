import { AriaDialogProps } from "@react-types/dialog";
import { DOMAttributes, FocusableElement } from "@react-types/shared";
import { RefObject } from "react";
export interface DialogAria {
    /** Props for the dialog container element. */
    dialogProps: DOMAttributes;
    /** Props for the dialog title element. */
    titleProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a dialog component.
 * A dialog is an overlay shown above other content in an application.
 */
export function useDialog(props: AriaDialogProps, ref: RefObject<FocusableElement>): DialogAria;
export type { AriaDialogProps } from '@react-types/dialog';

//# sourceMappingURL=types.d.ts.map
