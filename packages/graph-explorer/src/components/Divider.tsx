import { cn } from "@/utils";

export default function Divider({
  className,
  axis,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  axis?: "horizontal" | "vertical";
}) {
  if (axis === "vertical") {
    return (
      <div
        className={cn("bg-border mx-1 h-full w-[1px] min-w-[1px]", className)}
        {...props}
      />
    );
  } else {
    return (
      <div
        className={cn("bg-border my-1 h-[1px] min-h-[1px] w-full", className)}
        {...props}
      />
    );
  }
}
