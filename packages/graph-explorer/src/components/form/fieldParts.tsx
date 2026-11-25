import {
  type ComponentPropsWithRef,
  createContext,
  use,
  useId,
  useState,
} from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "../Field";
import { useFieldContext } from "./formContexts";

type FieldPartsContextValue = {
  controlId: string;
  descriptionId: string;
  errorId: string;
  /** The ids of the description and error on the page, for the control's aria-describedby. */
  describedBy: string | undefined;
  trackDescription: () => () => void;
  trackError: () => () => void;
};

const FieldPartsContext = createContext<FieldPartsContextValue | null>(null);

/** The ids field.Wrapper shares with its parts. Throws when part is rendered outside it. */
export function useFieldParts(part: string): FieldPartsContextValue {
  const context = use(FieldPartsContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside field.Wrapper`);
  }
  return context;
}

/** Whether the surrounding field shows its error: touched and invalid. */
export function useIsFieldInvalid(): boolean {
  const field = useFieldContext<unknown>();
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

/** Field that marks the field invalid and shares its ids with the parts inside it. */
export function BoundField(props: ComponentPropsWithRef<typeof Field>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const [hasDescription, setHasDescription] = useState(false);
  const [hasError, setHasError] = useState(false);
  const describedBy =
    [hasDescription && descriptionId, hasError && errorId]
      .filter(Boolean)
      .join(" ") || undefined;
  const isInvalid = useIsFieldInvalid();

  // Ref callbacks track which describers are on the page, so aria-describedby names only elements that exist.
  function trackDescription() {
    setHasDescription(true);
    return () => setHasDescription(false);
  }
  function trackError() {
    setHasError(true);
    return () => setHasError(false);
  }

  return (
    <FieldPartsContext
      value={{
        controlId: id,
        descriptionId,
        errorId,
        describedBy,
        trackDescription,
        trackError,
      }}
    >
      <Field {...props} data-invalid={isInvalid} />
    </FieldPartsContext>
  );
}

/** FieldLabel pointed at the field's control. */
export function BoundFieldLabel(
  props: Omit<ComponentPropsWithRef<typeof FieldLabel>, "htmlFor">,
) {
  const { controlId } = useFieldParts("field.Label");
  return <FieldLabel {...props} htmlFor={controlId} />;
}

/** FieldDescription with the id the field's control is described by. */
export function BoundFieldDescription(
  props: Omit<ComponentPropsWithRef<typeof FieldDescription>, "id" | "ref">,
) {
  const { descriptionId, trackDescription } =
    useFieldParts("field.Description");
  return (
    <FieldDescription {...props} id={descriptionId} ref={trackDescription} />
  );
}

/** FieldError showing the field's errors once it is touched and invalid. */
export function BoundFieldError(
  props: Omit<
    ComponentPropsWithRef<typeof FieldError>,
    "id" | "errors" | "ref"
  >,
) {
  const field = useFieldContext<unknown>();
  const { errorId, trackError } = useFieldParts("field.Error");
  const isInvalid = useIsFieldInvalid();

  if (!isInvalid) {
    return null;
  }

  return (
    <FieldError
      {...props}
      id={errorId}
      ref={trackError}
      errors={field.state.meta.errors}
    />
  );
}
