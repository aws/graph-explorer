import { cx } from "@emotion/css";
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
      className={cx(defaultStyles(), "trigger", className)}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

UseLayerTrigger.displayName = "UseLayerTrigger";
export default UseLayerTrigger;
