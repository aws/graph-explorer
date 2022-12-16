import { cx } from "@emotion/css";
import type {
  ForwardedRef,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import { forwardRef, Fragment, useMemo, useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import getChildrenOfType from "../../../utils/getChildrenOfType";
import type { IconButtonProps } from "../../IconButton";
import IconButton from "../../IconButton";
import ChevronLeftIcon from "../../icons/ChevronLeftIcon";
import CloseIcon from "../../icons/CloseIcon";
import MoreIcon from "../../icons/MoreIcon";
import UseLayer, { UseLayerOverlay, UseLayerTrigger } from "../../UseLayer";
import CollapsedActions from "./CollapsedActions";
import defaultStyles from "./ModuleContainerHeader.styles";
import ModuleContainerHeaderActions from "./ModuleContainerHeaderActions";

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
  badge?: IconButtonProps["badge"];
  badgeVariant?: IconButtonProps["badgeVariant"];
  collapsedItems?: ReactElement;
};

export type ActionItem = Action | "divider" | ReactNode;

export type ModuleContainerHeaderProps = PropsWithChildren<{
  id?: string;
  classNamePrefix?: string;
  className?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  startAdornment?: ReactNode;
  variant?: "sidebar" | "default" | "widget";
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
    classNamePrefix = "ft",
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
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const [collapsedActionsOpen, setCollapsedActionsOpen] = useState(false);

  // Make the component controlled and uncontrolled
  const actualCollapsedActionsOpen =
    isCollapsedMenuOpen ?? collapsedActionsOpen;
  const actualSetCollapsedActionsOpen =
    onCollapsedMenuChange ?? setCollapsedActionsOpen;

  const [alwaysVisibleActions, collapsibleActions]: [
    ActionItem[],
    (Action | "divider")[]
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
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("module-container-header"),
        className
      )}
    >
      {onBack && (
        <div className={pfx("back-action")}>
          <IconButton
            tooltipText={"Go Back"}
            variant={"text"}
            size={"small"}
            icon={<ChevronLeftIcon />}
            onPress={onBack}
          />
        </div>
      )}
      {startAdornment && (
        <div className={pfx("start-adornment")}>{startAdornment}</div>
      )}
      <div className={pfx("title-container")}>
        <div className={pfx("title")}>{title}</div>
        <div className={pfx("subtitle")}>{subtitle}</div>
      </div>
      <div className={pfx("children-container")}>{nonActionsChildren}</div>
      {actionsChildren}
      <div className={pfx("actions-container")}>
        {alwaysVisibleActions?.map((action, actionIndex) => {
          if (action === "divider") {
            return <div key={actionIndex} className={pfx("divider")} />;
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
                  badge={action.badge}
                  badgeVariant={action.badgeVariant}
                  badgePlacement={"bottom-right"}
                />
              </div>
            );
          }

          return <Fragment key={actionIndex}>{action}</Fragment>;
        })}
        {Boolean(collapsibleActions?.length) && variant === "sidebar" && (
          <UseLayer
            isOpen={actualCollapsedActionsOpen}
            placement={"bottom-end"}
            onOutsideClick={() => actualSetCollapsedActionsOpen(false)}
          >
            <UseLayerTrigger>
              <IconButton
                size={"base"}
                variant={"text"}
                icon={<MoreIcon />}
                onPress={() =>
                  actualSetCollapsedActionsOpen(!actualCollapsedActionsOpen)
                }
              />
            </UseLayerTrigger>
            <UseLayerOverlay>
              <CollapsedActions
                classNamePrefix={classNamePrefix}
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
          <div className={pfx("divider")} />
          <div className={pfx("close-action")}>
            <IconButton
              tooltipText={"Close"}
              variant={"text"}
              size={"small"}
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
