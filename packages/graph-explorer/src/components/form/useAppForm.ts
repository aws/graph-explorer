import { createFormHook } from "@tanstack/react-form";

import {
  BoundField,
  BoundFieldDescription,
  BoundFieldError,
  BoundFieldLabel,
} from "./fieldParts";
import { fieldContext, formContext } from "./formContexts";
import { SubmitButton } from "./SubmitButton";
import { BoundTextArea } from "./textControls";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Wrapper: BoundField,
    Label: BoundFieldLabel,
    Description: BoundFieldDescription,
    Error: BoundFieldError,
    TextArea: BoundTextArea,
  },
  formComponents: { SubmitButton },
});
