import { cn } from "@/utils";
import type { PropsWithChildren } from "react";

export type ModuleContainerFooterProps = {
  className?: string;
};

const ModuleContainerFooter = ({
  className,
  children,
}: PropsWithChildren<ModuleContainerFooterProps>) => {
  return (
    <div
      className={cn(
        "module-container-footer bg-background-default text-text-primary w-full border-t px-3 py-2",
        className
      )}
    >
      {children}
    </div>
  );
};

ModuleContainerFooter.displayName = "ModuleContainerFooter";

export default ModuleContainerFooter;
