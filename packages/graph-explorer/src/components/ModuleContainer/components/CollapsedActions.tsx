import { cx } from "@emotion/css";
import { cloneElement, useState } from "react";
import { useWithTheme } from "@/core";
import Card from "@/components/Card";
import ForwardIcon from "@/components/icons/ForwardIcon";
import ListItem from "@/components/ListItem";
import UseLayer from "@/components/UseLayer/UseLayer";
import UseLayerOverlay from "@/components/UseLayer/UseLayerOverlay";
import UseLayerTrigger from "@/components/UseLayer/UseLayerTrigger";
import defaultStyles from "./CollapsedActions.styles";
import { Action } from "./ModuleContainerHeader";
import ModuleContainerVerticalDivider from "./ModuleContainerVerticalDivider";

export type CollapsedActionsProps = {
  actions: (Action | "divider")[];
  onActionClick(action: string): void;
};

const CollapsedActions = ({
  actions,
  onActionClick,
}: CollapsedActionsProps) => {
  const styleWithTheme = useWithTheme();

  const [open, setOpen] = useState(-1);

  return (
    <Card className={cx(styleWithTheme(defaultStyles), "collapsed-actions")}>
      {actions.map((action, actionIndex) => {
        if (
          (actionIndex === 0 || actionIndex === actions.length - 1) &&
          action === "divider"
        ) {
          return null;
        }

        if (action === "divider") {
          return <ModuleContainerVerticalDivider key={actionIndex} />;
        }

        if (action.collapsedItems) {
          return (
            <UseLayer
              key={"collapsed-container-" + actionIndex}
              isOpen={open === actionIndex}
              auto={true}
              possiblePlacements={["left-start", "right-start"]}
              overflowContainer={true}
            >
              <UseLayerTrigger>
                <ListItem
                  className={cx("list-item", {
                    ["submenu-is-open"]: open === actionIndex,
                    ["submenu-is-disabled"]: action.isDisabled,
                  })}
                  clickable={!action.isDisabled}
                  startAdornment={action.icon}
                  endAdornment={<ForwardIcon />}
                  onClick={() =>
                    setOpen(open => (open === actionIndex ? -1 : actionIndex))
                  }
                >
                  {action.label}
                </ListItem>
              </UseLayerTrigger>
              <UseLayerOverlay>
                {cloneElement(action.collapsedItems, {
                  parentLayerSide: "left",
                  className: styleWithTheme(defaultStyles),
                })}
              </UseLayerOverlay>
            </UseLayer>
          );
        }

        return (
          <ListItem
            key={action.value}
            ref={action.ref}
            className="list-item"
            clickable={!action.isDisabled}
            onClick={() => {
              onActionClick(action.value);
            }}
            startAdornment={action.icon}
          >
            {action.label}
          </ListItem>
        );
      })}
    </Card>
  );
};

export default CollapsedActions;
