import type { ComponentPropsWithRef } from "react";

import { Button } from "../Button";
import { useFormContext } from "./formContexts";

/**
 * A submit button that is `aria-disabled` and ignores activation while the
 * form submits or can't submit.
 */
export function SubmitButton({
  disabled,
  onClick,
  ...props
}: ComponentPropsWithRef<typeof Button>) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={state => [state.canSubmit, state.isSubmitting] as const}
    >
      {([canSubmit, isSubmitting]) => {
        // aria-disabled rather than disabled, so focus stays on the button.
        const unavailable = disabled || !canSubmit || isSubmitting;
        return (
          <Button
            type="submit"
            aria-disabled={unavailable}
            onClick={event => {
              if (unavailable) {
                event.preventDefault();
                return;
              }
              onClick?.(event);
            }}
            {...props}
          />
        );
      }}
    </form.Subscribe>
  );
}
