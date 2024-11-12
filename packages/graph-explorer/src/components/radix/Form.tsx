import React from "react";
import { cn } from "@/utils";

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("space-y-1", className)} {...props} />;
});
FormItem.displayName = "FormItem";

export { FormItem };
