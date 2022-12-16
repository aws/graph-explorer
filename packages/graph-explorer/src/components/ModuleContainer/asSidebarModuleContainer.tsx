import type { ComponentType, ReactNode } from "react";
import ModuleContainerHeader from "./components/ModuleContainerHeader";
import ModuleContainer from "./ModuleContainer";

export type SidebarModuleContainerProps<
  T extends Record<string, any> = Record<string, any>
> = T & {
  title: string;
  onClose(): void;
  startAdornment?: ReactNode;
};

/* eslint-disable react/display-name */
const asSidebarModuleContainer = <
  TProps extends Record<string, any> = Record<string, any>
>(
  Component: ComponentType<TProps>,
  baseProps: Partial<TProps> = {}
) => ({
  title,
  onClose,
  startAdornment,
  ...props
}: SidebarModuleContainerProps<TProps>) => {
  return (
    <ModuleContainer variant={"sidebar"}>
      <ModuleContainerHeader
        variant={"sidebar"}
        title={title}
        onClose={onClose}
        startAdornment={startAdornment}
      />
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/*// @ts-ignore */}
      <Component {...baseProps} {...props} />
    </ModuleContainer>
  );
};

export default asSidebarModuleContainer;
