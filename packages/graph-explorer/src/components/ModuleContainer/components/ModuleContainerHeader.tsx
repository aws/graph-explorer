import { cn } from "@/utils";
import type {
  ForwardedRef,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import { forwardRef, Fragment, useMemo, useState } from "react";

import getChildrenOfType from "@/utils/getChildrenOfType";
import IconButton from "@/components/IconButton";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon";
import CloseIcon from "@/components/icons/CloseIcon";
import MoreIcon from "@/components/icons/MoreIcon";
import UseLayer, {
  UseLayerOverlay,
  UseLayerTrigger,
} from "@/components/UseLayer";
import CollapsedActions from "./CollapsedActions";
import ModuleContainerHeaderActions from "./ModuleContainerHeaderActions";
import ModuleContainerVerticalDivider from "./ModuleContainerVerticalDivider";

export type Action = {
  label: string;
  value: string;
  icon: ReactNode;
  color?: "success" | "error" | "warning" | "info" | "primary";
  ref?: RefObject<HTMLDivElement>;
  keepOpenOnSelect?: boolean;
  alwaysVisible?: boolean;
  active?: boolean;
  onlyPinnedVisible?: boolean;
  isDisabled?: boolean;
  collapsedItems?: ReactElement;
};

export type ActionItem = Action | ReactNode;

export type ModuleContainerHeaderProps = PropsWithChildren<{
  id?: string;
  className?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  startAdornment?: ReactNode;
  variant?: "sidebar" | "default";
  onClose?(): void;
  onBack?(): void;
  actions?: Array<ActionItem>;
  onActionClick?(action: string): void;
  isCollapsedMenuOpen?: boolean;
  onCollapsedMenuChange?(isOpen: boolean): void;
}>;

const isActionType = (action: any): action is Action => {
  return (
    action.value !== undefined &&
    action.label !== undefined &&
    action.icon !== undefined
  );
};

const ModuleContainerHeader = (
  {
    id,
    className,
    title,
    subtitle,
    startAdornment,
    variant = "default",
    onBack,
    onClose,
    actions,
    onActionClick,
    children,
    isCollapsedMenuOpen,
    onCollapsedMenuChange,
  }: ModuleContainerHeaderProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [collapsedActionsOpen, setCollapsedActionsOpen] = useState(false);

  // Make the component controlled and uncontrolled
  const actualCollapsedActionsOpen =
    isCollapsedMenuOpen ?? collapsedActionsOpen;
  const actualSetCollapsedActionsOpen =
    onCollapsedMenuChange ?? setCollapsedActionsOpen;

  const [alwaysVisibleActions, collapsibleActions]: [
    ActionItem[],
    (Action | "divider")[],
  ] = useMemo(() => {
    if (variant === "default") {
      return [actions || [], []];
    }

    const visible: ActionItem[] = [];
    const collapsed: (Action | "divider")[] = [];

    actions?.forEach(action => {
      if (isActionType(action) && action.alwaysVisible) {
        visible.push(action);
        return;
      }

      if (isActionType(action) && action.onlyPinnedVisible) {
        return;
      }

      if (action === "divider") {
        collapsed.push(action as "divider");
        return;
      }

      if (isActionType(action)) {
        collapsed.push(action);
        return;
      }

      visible.push(action);
    });
    return [visible, collapsed];
  }, [actions, variant]);

  const actionsChildren = useMemo(() => {
    return getChildrenOfType(
      children,
      ModuleContainerHeaderActions.displayName ||
        ModuleContainerHeaderActions.name
    );
  }, [children]);

  const nonActionsChildren = useMemo(() => {
    return getChildrenOfType(
      children,
      ModuleContainerHeaderActions.displayName ||
        ModuleContainerHeaderActions.name,
      true
    );
  }, [children]);

  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        "bg-background-default text-text-primary flex min-h-[3rem] w-full items-center gap-1 border-b px-3 py-1",
        className
      )}
    >
      {onBack && (
        <div className="mr-1">
          <IconButton
            tooltipText="Go Back"
            variant="text"
            size="small"
            icon={<ChevronLeftIcon />}
            onPress={onBack}
          />
        </div>
      )}
      {startAdornment && (
        <div className="mr-2 flex items-center">{startAdornment}</div>
      )}
      <div>
        <div className="line-clamp-1 font-bold">{title}</div>
        <div className="line-clamp-1 text-xs">{subtitle}</div>
      </div>
      <div className="grow">{nonActionsChildren}</div>
      {actionsChildren}
      <div className="flex h-full items-center justify-end gap-1">
        {alwaysVisibleActions?.map((action, actionIndex) => {
          if (action === "divider") {
            return <ModuleContainerVerticalDivider key={actionIndex} />;
          }

          if (isActionType(action)) {
            return (
              <div key={action.value} ref={action.ref}>
                <IconButton
                  isDisabled={action.isDisabled}
                  tooltipText={action.label}
                  variant={action.active ? "filled" : "text"}
                  color={action.color}
                  icon={action.icon}
                  onPress={() => onActionClick?.(action.value)}
                  className="hover:text-primary-main focus-visible:text-primary-main focus-visible:bg-primary-main/20"
                />
              </div>
            );
          }

          return <Fragment key={actionIndex}>{action}</Fragment>;
        })}
        {Boolean(collapsibleActions?.length) && variant === "sidebar" && (
          <UseLayer
            isOpen={actualCollapsedActionsOpen}
            placement="bottom-end"
            onOutsideClick={() => actualSetCollapsedActionsOpen(false)}
          >
            <UseLayerTrigger>
              <IconButton
                size="base"
                variant="text"
                icon={<MoreIcon />}
                onPress={() =>
                  actualSetCollapsedActionsOpen(!actualCollapsedActionsOpen)
                }
              />
            </UseLayerTrigger>
            <UseLayerOverlay>
              <CollapsedActions
                actions={collapsibleActions}
                onActionClick={action => {
                  onActionClick?.(action);
                  actualSetCollapsedActionsOpen(false);
                }}
              />
            </UseLayerOverlay>
          </UseLayer>
        )}
      </div>
      {onClose && (
        <>
          <ModuleContainerVerticalDivider />
          <div className="close-action">
            <IconButton
              tooltipText="Close"
              variant="text"
              size="small"
              icon={<CloseIcon />}
              onPress={onClose}
            />
          </div>
        </>
      )}
    </div>
  );
};

const ComponentWithRef = forwardRef<HTMLDivElement, ModuleContainerHeaderProps>(
  ModuleContainerHeader
);
ComponentWithRef.displayName = "ModuleContainerHeader";

export default ComponentWithRef;
