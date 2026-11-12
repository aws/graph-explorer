import { Switch as SwitchPrimitives } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

function Switch({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer data-checked:bg-primary data-unchecked:bg-input-border aria-invalid:border-danger aria-invalid:ring-danger/20 focus-visible:focus-ring data-checked:focus-visible:outline-background inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
}
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
