import { createFormHook } from "@tanstack/react-form";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "../InputGroup";
import {
  BoundField,
  BoundFieldDescription,
  BoundFieldError,
  BoundFieldLabel,
} from "./fieldParts";
import { fieldContext, formContext } from "./formContexts";
import { SubmitButton } from "./SubmitButton";
import { BoundInputGroupTextarea, BoundTextArea } from "./textControls";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Wrapper: BoundField,
    Label: BoundFieldLabel,
    Description: BoundFieldDescription,
    Error: BoundFieldError,
    TextArea: BoundTextArea,
    InputGroupTextarea: BoundInputGroupTextarea,
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
  },
  formComponents: { SubmitButton },
});
