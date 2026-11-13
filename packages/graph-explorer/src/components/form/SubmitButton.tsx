import type { ComponentPropsWithRef, ComponentType, MouseEvent } from "react";

import { Slot } from "radix-ui";

import { Button, type ButtonProps } from "../Button";
import { useFormContext } from "./formContexts";

// The cast narrows Slot to the button it always wraps here. Without it, the
// pointer capture handlers in `@types/global.d.ts` don't accept button events.
const ButtonSlot = Slot.Root as ComponentType<ComponentPropsWithRef<"button">>;

type SubmitButtonProps = Omit<
  ButtonProps,
  "asChild" | "type" | "aria-disabled"
> & {
  /** Slots only the submit behavior onto the single child, which keeps its own styling. */
  asChild?: boolean;
};

/**
 * A submit button that is `aria-disabled` and ignores activation while the
 * form submits or can't submit.
 */
export function SubmitButton({
  asChild,
  disabled,
  onClick,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={state => [state.canSubmit, state.isSubmitting] as const}
    >
      {([canSubmit, isSubmitting]) => {
        // aria-disabled rather than disabled, so focus stays on the button.
        const unavailable = disabled || !canSubmit || isSubmitting;
        const submitProps = {
          type: "submit",
          "aria-disabled": unavailable,
          onClick(event: MouseEvent<HTMLButtonElement>) {
            if (unavailable) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          },
          ...props,
        } as const;
        return asChild ? (
          <ButtonSlot {...submitProps} />
        ) : (
          <Button {...submitProps} />
        );
      }}
    </form.Subscribe>
  );
}
