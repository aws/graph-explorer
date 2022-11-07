import { cx } from "@emotion/css";
import Card from "../../../components/Card/Card";
import DetailsIcon from "../../../components/icons/DetailsIcon";
import StarIcon from "../../../components/icons/StarIcon";
import ListItem from "../../../components/ListItem/ListItem";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import defaultStyles from "./ContextMenu.styles";

export type ContextMenuProps = {
  classNamePrefix?: string;
  className?: string;
  onMarkPrimaryClick?(): void;
  onMarkDescriptionClick?(): void;
};

const ContextMenu = ({
  classNamePrefix = "ft",
  className,
  onMarkPrimaryClick,
  onMarkDescriptionClick,
}: ContextMenuProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("context-menu"),
        className
      )}
    >
      <Card className={pfx("card-root")}>
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={onMarkPrimaryClick}
          startAdornment={<StarIcon />}
        >
          Use as Node Name
        </ListItem>
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={onMarkDescriptionClick}
          startAdornment={<DetailsIcon />}
        >
          Use as Description
        </ListItem>
      </Card>
    </div>
  );
};

export default ContextMenu;
