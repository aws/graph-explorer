import { cx } from "@emotion/css";
import type { ForwardedRef, PropsWithChildren } from "react";
import { forwardRef, useMemo } from "react";
import { useWithTheme } from "../../core";
import getChildOfType from "../../utils/getChildOfType";
import getChildrenOfType from "../../utils/getChildrenOfType";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import ModuleContainerFooter from "./components/ModuleContainerFooter";
import ModuleContainerHeader from "./components/ModuleContainerHeader";
import defaultStyles from "./ModuleContainer.styles";

export type ModuleContainerProps = {
  id?: string;
  className?: string;
  /**
   * Variant allows to render the module to be attached in a sidebar
   * or be inside the main layout (default).
   */
  variant?: "sidebar" | "default" | "widget";

  onClose?(): void;
  onBack?(): void;

  isLoading?: boolean;
};

const ModuleContainer = (
  {
    id,
    children,
    className,
    variant = "default",
    isLoading,
  }: PropsWithChildren<ModuleContainerProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const styleWithTheme = useWithTheme();
  const rootClassname = useMemo(
    () => styleWithTheme(defaultStyles),
    [styleWithTheme]
  );

  const headerContainerChildren = useMemo(() => {
    return getChildOfType(
      children,
      ModuleContainerHeader.displayName || ModuleContainerHeader.name
    );
  }, [children]);

  const footerContainerChildren = useMemo(() => {
    return getChildOfType(
      children,
      ModuleContainerFooter.displayName || ModuleContainerFooter.name
    );
  }, [children]);

  const restChildren = useMemo(() => {
    return getChildrenOfType(
      children,
      [
        ModuleContainerHeader.displayName || ModuleContainerHeader.name,
        ModuleContainerFooter.displayName || ModuleContainerFooter.name,
      ],
      true
    );
  }, [children]);

  return (
    <div
      ref={ref}
      id={id}
      className={cx(
        rootClassname,
        "module-container",
        `variant-${variant}`,
        className
      )}
    >
      {headerContainerChildren}
      <div className={"content"}>
        {isLoading && (
          <div className={"loading"}>
            <LoadingSpinner />
          </div>
        )}
        {!isLoading && restChildren}
      </div>
      {footerContainerChildren}
    </div>
  );
};

export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<ModuleContainerProps>
>(ModuleContainer);
