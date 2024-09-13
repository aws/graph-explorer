import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import defaultStyles from "./UseLayer.styles";

export type UseLayerOverlayProps = {
  className?: string;
};

const UseLayerOverlay = ({
  className,
  children,
}: PropsWithChildren<UseLayerOverlayProps>) => {
  return (
    <div className={cn(defaultStyles(), "overlay", className)}>{children}</div>
  );
};

UseLayerOverlay.displayName = "UseLayerOverlay";
export default UseLayerOverlay;
