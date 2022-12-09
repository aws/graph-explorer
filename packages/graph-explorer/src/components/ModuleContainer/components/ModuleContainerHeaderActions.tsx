import { cx } from "@emotion/css";
import { Fragment, useMemo, useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import IconButton from "../../IconButton";
import MoreIcon from "../../icons/MoreIcon";
import UseLayer, { UseLayerOverlay, UseLayerTrigger } from "../../UseLayer";
import CollapsedActions from "./CollapsedActions";
import type { Action, ActionItem } from "./ModuleContainerHeader";
import defaultStyles from "./ModuleContainerHeaderActions.styles";

export type ModuleContainerHeaderActionsProps = {
  variant?: "sidebar" | "default";
  classNamePrefix?: string;
  actions?: Array<ActionItem>;
  onActionClick?(action: string): void;
  isCollapsedMenuOpen?: boolean;
  onCollapsedMenuChange?(isOpen: boolean): void;
};

const isActionType = (action: any): action is Action => {
  return (
    action.value !== undefined &&
    action.label !== undefined &&
    action.icon !== undefined
  );
};

const ModuleContainerHeaderActions = ({
  classNamePrefix = "ft",
  variant,
  actions,
  onActionClick,
  isCollapsedMenuOpen,
  onCollapsedMenuChange,
}: ModuleContainerHeaderActionsProps) => {
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
    ("divider" | Action)[]
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

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("module-container-header-actions")
      )}
    >
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
                variant={"text"}
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
  );
};

ModuleContainerHeaderActions.displayName = "ModuleContainerHeaderActions";
export default ModuleContainerHeaderActions;
