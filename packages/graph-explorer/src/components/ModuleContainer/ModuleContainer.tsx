import { cx } from "@emotion/css";
import type { ForwardedRef, PropsWithChildren } from "react";
import { forwardRef, useMemo } from "react";
import getChildOfType from "@/utils/getChildOfType";
import getChildrenOfType from "@/utils/getChildrenOfType";
import ModuleContainerFooter from "./components/ModuleContainerFooter";
import ModuleContainerHeader from "./components/ModuleContainerHeader";

export type ModuleContainerProps = {
  id?: string;
  className?: string;
  /**
   * Variant allows to render the module to be attached in a sidebar
   * or be inside the main layout (default).
   */
  variant?: "sidebar" | "default";
};

const ModuleContainer = (
  {
    id,
    children,
    className,
    variant = "default",
  }: PropsWithChildren<ModuleContainerProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
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
        "bg-background-secondary text-text-secondary flex h-full flex-col overflow-hidden",
        variant === "default" && "shadow-base rounded",
        className
      )}
    >
      {headerContainerChildren}
      <div className="flex grow flex-col overflow-hidden">{restChildren}</div>
      {footerContainerChildren}
    </div>
  );
};

export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<ModuleContainerProps>
>(ModuleContainer);
