import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { cn } from "@/utils";

const SidebarButton = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
    icon: React.ReactElement;
    title: React.ReactNode;
    badge?: boolean;
  }
>(({ icon, title, badge = false, className, children, ...props }, ref) => {
  return (
    <Badge value={badge}>
      <Tooltip>
        <TooltipTrigger>
          <TogglePrimitive.Root
            ref={ref}
            className={cn(
              "text-brand-900 data-[state=on]:bg-brand-500 active:bg-brand-300 inline-flex size-10 items-center justify-center rounded-md bg-transparent p-2 ring-0 transition-colors duration-100 focus:shadow-none active:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-white [&_svg]:size-6",
              "hover:bg-brand-200/50 hover:text-primary-dark hover:data-[state=on]:bg-brand-400",
              "dark:text-brand-300 dark:hover:data-[state=on]:bg-brand-500 dark:data-[state=on]:bg-brand-400 dark:hover:bg-gray-800 dark:data-[state=on]:text-white",
              "focus-visible:ring-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:ring-0",
              className
            )}
            {...props}
          >
            {icon}
            {children}
            <span className="sr-only">{title}</span>
          </TogglePrimitive.Root>
        </TooltipTrigger>
        <TooltipContent side="left">{title}</TooltipContent>
      </Tooltip>
    </Badge>
  );
});

function Badge({
  children,
  value,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { value?: boolean }) {
  return (
    <div className="stack" {...props}>
      {children}
      {value ? (
        <span
          aria-description="badge"
          className="bg-error-main pointer-events-none -mr-0.5 -mt-0.5 size-2.5 place-self-start justify-self-end rounded-full"
        />
      ) : null}
    </div>
  );
}

SidebarButton.displayName = "SidebarButton";

export { SidebarButton };
