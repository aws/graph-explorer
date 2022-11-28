import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { Children } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";

import defaultStyles from "./ModuleContainerFooter.styles";

export type ModuleContainerFooterProps = {
  classNamePrefix?: string;
  className?: string;
};

const ModuleContainerFooter = ({
  classNamePrefix = "ft",
  className,
  children,
}: PropsWithChildren<ModuleContainerFooterProps>) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const numberOfChildren = Children.count(children);
  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("module-container-footer"),
        { [pfx("single-child")]: numberOfChildren === 1 },
        className
      )}
    >
      {children}
    </div>
  );
};

ModuleContainerFooter.displayName = "ModuleContainerFooter";

export default ModuleContainerFooter;
