import type { ChangeEvent, ComponentPropsWithRef } from "react";

import { TextArea } from "../TextArea";
import { useFieldParts, useIsFieldInvalid } from "./fieldParts";
import { useFieldContext } from "./formContexts";

type BoundControlProps = {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

/** The props that bind a text control to the surrounding field and its field.Wrapper. */
export function useBoundControlProps(part: string): BoundControlProps {
  const field = useFieldContext<string>();
  const { controlId, describedBy } = useFieldParts(part);
  const isInvalid = useIsFieldInvalid();

  return {
    id: controlId,
    name: field.name,
    value: field.state.value,
    onBlur: field.handleBlur,
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) =>
      field.handleChange(e.target.value),
    "aria-invalid": isInvalid,
    "aria-describedby": describedBy,
  };
}

/** TextArea bound to the surrounding field. */
export function BoundTextArea(
  props: Omit<ComponentPropsWithRef<typeof TextArea>, keyof BoundControlProps>,
) {
  const bound = useBoundControlProps("field.TextArea");
  return <TextArea {...props} {...bound} />;
}
