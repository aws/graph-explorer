import { cx } from "@emotion/css";
import { cloneElement, useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import Card from "../../Card";
import ForwardIcon from "../../icons/ForwardIcon";
import ListItem from "../../ListItem";
import UseLayer from "../../UseLayer/UseLayer";
import UseLayerOverlay from "../../UseLayer/UseLayerOverlay";
import UseLayerTrigger from "../../UseLayer/UseLayerTrigger";
import defaultStyles from "./CollapsedActions.styles";
import { Action } from "./ModuleContainerHeader";

export type CollapsedActionsProps = {
  classNamePrefix?: string;
  actions: (Action | "divider")[];
  onActionClick(action: string): void;
};

const CollapsedActions = ({
  classNamePrefix = "ft",
  actions,
  onActionClick,
}: CollapsedActionsProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [open, setOpen] = useState(-1);

  return (
    <Card
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("collapsed-actions")
      )}
    >
      {actions.map((action, actionIndex) => {
        if (
          (actionIndex === 0 || actionIndex === actions.length - 1) &&
          action === "divider"
        ) {
          return null;
        }

        if (action === "divider") {
          return <div key={actionIndex} className={pfx("divider")} />;
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
                  classNamePrefix={"ft"}
                  className={cx(pfx("list-item"), {
                    [pfx("submenu-is-open")]: open === actionIndex,
                    [pfx("submenu-is-disabled")]: action.isDisabled,
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
                  className: styleWithTheme(defaultStyles(classNamePrefix)),
                })}
              </UseLayerOverlay>
            </UseLayer>
          );
        }

        return (
          <ListItem
            key={action.value}
            ref={action.ref}
            className={pfx("list-item")}
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
