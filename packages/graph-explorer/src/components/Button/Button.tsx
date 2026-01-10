import { cn } from "@/utils";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "cva";
import { Slot } from "radix-ui";

export const buttonStyles = cva({
  base: "inline-flex items-center justify-center gap-2 font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 disabled:saturate-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:saturate-0 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      filled: "",
      default: "",
      text: "",
      outline: "",
    },
    color: {
      primary: "",
      danger: "",
    },
    size: {
      small: "h-8 rounded-sm px-2 text-base [&_svg]:size-5",
      base: "h-10 rounded-md px-4 text-base [&_svg]:size-5",
      large: "h-12 rounded-md px-5 text-lg [&_svg]:size-6",
    },
  },
  compoundVariants: [
    {
      variant: "filled",
      color: "primary",
      className:
        "bg-brand hover:bg-brand-hover data-open:bg-brand-hover text-white",
    },
    {
      variant: "filled",
      color: "danger",
      className:
        "bg-danger hover:bg-danger-hover data-open:bg-danger-hover text-white",
    },
    {
      variant: "default",
      color: "primary",
      className:
        "text-text-primary bg-gray-100 hover:bg-gray-200 data-open:bg-gray-200",
    },
    {
      variant: "default",
      color: "danger",
      className:
        "bg-danger-subtle text-danger hover:bg-danger-subtle-hover data-open:bg-danger-subtle-hover",
    },
    {
      variant: "text",
      color: "primary",
      className:
        "text-primary-foreground hover:bg-primary-subtle data-open:bg-primary-subtle",
    },
    {
      variant: "text",
      color: "danger",
      className:
        "text-danger hover:bg-danger-subtle data-open:bg-danger-subtle",
    },
    {
      variant: "outline",
      color: "primary",
      className:
        "text-text-primary border-input hover:bg-muted data-open:border-primary-main border bg-transparent shadow-xs",
    },
    {
      variant: "outline",
      color: "danger",
      className:
        "border-error-light text-danger hover:bg-danger-subtle data-open:border-error-main border shadow-xs",
    },
  ],
  defaultVariants: {
    variant: "default",
    color: "primary",
    size: "base",
  },
});

export interface ButtonProps
  extends
    VariantProps<typeof buttonStyles>,
    VariantProps<typeof buttonStyles>,
    Omit<React.ComponentPropsWithRef<"button">, "color"> {
  icon?: ReactNode;
  asChild?: boolean;

  // TODO: Remove these non-standard props and use the `disabled` and `onClick` props instead.
  // These are here to reduce the amount of changes to the rest of the codebase.
  isDisabled?: boolean;
  onPress?: () => void;
}

function Button({
  className,
  icon,
  variant = "default",
  size,
  color,
  children,
  asChild = false,
  isDisabled,
  onPress,
  ...props
}: ButtonProps) {
  const Component = asChild ? (Slot.Root as any) : "button";
  return (
    <Component
      className={cn(buttonStyles({ size, variant, color }), className)}
      disabled={isDisabled}
      onClick={onPress}
      {...props}
    >
      {icon && icon}
      {children}
    </Component>
  );
}
Button.displayName = "Button";

/** Wrap an action to stop button click propagation. */
export function stopPropagation(action: () => void | Promise<void>) {
  return async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    await action();
  };
}

export { Button };
