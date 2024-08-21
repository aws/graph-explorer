import { cx } from "@emotion/css";
import { Fragment, useMemo, useState } from "react";
import { useWithTheme } from "@/core";
import IconButton from "@/components/IconButton";
import MoreIcon from "@/components/icons/MoreIcon";
import UseLayer, {
  UseLayerOverlay,
  UseLayerTrigger,
} from "@/components/UseLayer";
import CollapsedActions from "./CollapsedActions";
import type { Action, ActionItem } from "./ModuleContainerHeader";
import defaultStyles from "./ModuleContainerHeaderActions.styles";
import ModuleContainerVerticalDivider from "./ModuleContainerVerticalDivider";

export type ModuleContainerHeaderActionsProps = {
  variant?: "sidebar" | "default";
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
  variant,
  actions,
  onActionClick,
  isCollapsedMenuOpen,
  onCollapsedMenuChange,
}: ModuleContainerHeaderActionsProps) => {
  const styleWithTheme = useWithTheme();
  const [collapsedActionsOpen, setCollapsedActionsOpen] = useState(false);

  // Make the component controlled and uncontrolled
  const actualCollapsedActionsOpen =
    isCollapsedMenuOpen ?? collapsedActionsOpen;
  const actualSetCollapsedActionsOpen =
    onCollapsedMenuChange ?? setCollapsedActionsOpen;

  const [alwaysVisibleActions, collapsibleActions]: [
    ActionItem[],
    ("divider" | Action)[],
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
        styleWithTheme(defaultStyles),
        "module-container-header-actions"
      )}
    >
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
                variant="text"
                icon={action.icon}
                onPress={() => onActionClick?.(action.value)}
                badge={action.badge}
                badgeVariant={action.badgeVariant}
                badgePlacement="bottom-right"
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
