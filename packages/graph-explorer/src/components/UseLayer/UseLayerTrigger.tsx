import { cn } from "@/utils";
import type { PropsWithChildren } from "react";

import defaultStyles from "./UseLayer.styles";

export type UseLayerTriggerProps = {
  className?: string;
};

const UseLayerTrigger = ({
  className,
  children,
}: PropsWithChildren<UseLayerTriggerProps>) => {
  return (
    <div
      className={cn(defaultStyles(), "trigger", className)}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

UseLayerTrigger.displayName = "UseLayerTrigger";
export default UseLayerTrigger;
