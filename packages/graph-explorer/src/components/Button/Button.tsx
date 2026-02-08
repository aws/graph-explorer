import { cva, type VariantProps } from "cva";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip";

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
      small: "h-8 rounded-md px-2 text-sm [&_svg]:size-4",
      base: "h-10 rounded-md px-4 text-base [&_svg]:size-5",
      large: "h-12 rounded-md px-5 text-lg [&_svg]:size-6",

      "icon-small": "h-8 min-w-8 rounded-md text-sm [&_svg]:size-4",
      icon: "h-10 min-w-10 rounded-md text-base [&_svg]:size-[1.325rem]",
      "icon-large": "h-12 min-w-12 rounded-md text-lg [&_svg]:size-6",
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
    Omit<React.ComponentPropsWithRef<"button">, "color"> {
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size,
  color,
  title,
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? (Slot.Root as any) : "button";
  const content = (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonStyles({ size, variant, color }), className)}
      {...props}
    >
      {children}
      {title && <span className="sr-only">{title}</span>}
    </Component>
  );

  if (title) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
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
