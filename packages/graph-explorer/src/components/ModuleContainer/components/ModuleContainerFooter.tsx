import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { Children } from "react";
import { useWithTheme } from "../../../core";

import defaultStyles from "./ModuleContainerFooter.styles";

export type ModuleContainerFooterProps = {
  className?: string;
};

const ModuleContainerFooter = ({
  className,
  children,
}: PropsWithChildren<ModuleContainerFooterProps>) => {
  const styleWithTheme = useWithTheme();
  const numberOfChildren = Children.count(children);
  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles),
        "module-container-footer",
        { ["single-child"]: numberOfChildren === 1 },
        className
      )}
    >
      {children}
    </div>
  );
};

ModuleContainerFooter.displayName = "ModuleContainerFooter";

export default ModuleContainerFooter;
