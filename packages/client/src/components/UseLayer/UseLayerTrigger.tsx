import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { withClassNamePrefix } from "../../core";

import defaultStyles from "./UseLayer.styles";

export type UseLayerTriggerProps = {
  classNamePrefix?: string;
  className?: string;
};

const UseLayerTrigger = ({
  classNamePrefix = "ft",
  className,
  children,
}: PropsWithChildren<UseLayerTriggerProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      className={cx(defaultStyles(classNamePrefix), pfx("trigger"), className)}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

UseLayerTrigger.displayName = "UseLayerTrigger";
export default UseLayerTrigger;
