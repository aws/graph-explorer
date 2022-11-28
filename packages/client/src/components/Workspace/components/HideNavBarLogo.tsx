import { cx } from "@emotion/css";
import type { MouseEvent, ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import { ConnectedIcon, MenuIcon } from "../../icons";
import defaultStyles from "./HideNavBarLogo.style";

export interface HideNavBarLogoProps {
  className?: string;
  classNamePrefix?: string;
  logo?: ReactNode;
  isVisible?: boolean;
  onClick?(e: MouseEvent<HTMLDivElement>): void;
}

const HideNavBarLogo = ({
  className,
  classNamePrefix = "ft",
  logo,
  isVisible,
  onClick,
}: HideNavBarLogoProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("navbar-logo"),
        className
      )}
    >
      <div
        className={cx(pfx("navbar-logo-container"), {
          [pfx("hide-logo")]: !isVisible,
        })}
        onClick={onClick}
      >
        <div className={pfx("logo")}>
          {logo || <ConnectedIcon width={"2em"} height={"2em"} />}
        </div>
        {!!onClick && (
          <div className={cx(pfx("menu-logo"))}>
            <MenuIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default HideNavBarLogo;
