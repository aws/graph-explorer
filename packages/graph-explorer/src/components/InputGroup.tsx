import type { ComponentPropsWithRef } from "react";

import { cva, type VariantProps } from "cva";

import { cn } from "@/utils";

import { Button, type ButtonProps } from "./Button";
import { Input } from "./Input";
import { TextArea } from "./TextArea";

/** A text input or textarea with addons, such as icons, text, or buttons, inside its border. */
function InputGroup({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="input-group"
      // A fieldset would break the component's layout composition and add default styling.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      className={cn(
        "group/input-group border-input-border bg-input-background has-[[data-slot=input-group-control]:focus-visible]:focus-ring has-[[data-slot][aria-invalid=true]]:border-danger has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:ring-danger/50 has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:outline-danger relative flex h-10 w-full min-w-0 items-center rounded-md border shadow-xs transition-colors outline-none has-disabled:opacity-50 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva({
  base: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-sm [&>svg:not([class*='size-'])]:size-4",
  variants: {
    align: {
      "inline-start":
        "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
      "inline-end":
        "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
      "block-start":
        "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
      "block-end":
        "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
});

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: ComponentPropsWithRef<"div"> &
  VariantProps<typeof inputGroupAddonVariants>) {
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }
    event.currentTarget.parentElement
      ?.querySelector<HTMLElement>("[data-slot=input-group-control]")
      ?.focus();
  }

  return (
    // Clicking the addon's text forwards focus to the control; the control stays the keyboard target.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      // A fieldset would break the component's layout composition and add default styling.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={handleClick}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva({
  base: "shadow-none",
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-sm px-1.5 [&_svg]:size-3.5",
      sm: "",
      "icon-xs": "size-6 min-w-6 rounded-sm p-0",
      "icon-sm": "size-8 min-w-8 p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<ButtonProps, "size"> & VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      size="small"
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({
  className,
  ...props
}: ComponentPropsWithRef<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: ComponentPropsWithRef<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <TextArea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 focus-visible:outline-none disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
