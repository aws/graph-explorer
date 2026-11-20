import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./formContexts";
import { SubmitButton } from "./SubmitButton";
import { TextAreaFormField } from "./TextAreaFormField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextAreaFormField },
  formComponents: { SubmitButton },
});
