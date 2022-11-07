import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { withClassNamePrefix } from "../../core";
import defaultStyles from "./UseLayer.styles";

export type UseLayerOverlayProps = {
  classNamePrefix?: string;
  className?: string;
};

const UseLayerOverlay = ({
  classNamePrefix = "ft",
  className,
  children,
}: PropsWithChildren<UseLayerOverlayProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <div
      className={cx(defaultStyles(classNamePrefix), pfx("overlay"), className)}
    >
      {children}
    </div>
  );
};

UseLayerOverlay.displayName = "UseLayerOverlay";
export default UseLayerOverlay;
