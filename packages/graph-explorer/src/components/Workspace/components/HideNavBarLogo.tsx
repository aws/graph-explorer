import { cx } from "@emotion/css";
import type { MouseEvent, ReactNode } from "react";
import { useWithTheme } from "../../../core";
import { ConnectedIcon, MenuIcon } from "../../icons";
import defaultStyles from "./HideNavBarLogo.style";

export interface HideNavBarLogoProps {
  className?: string;
  logo?: ReactNode;
  isVisible?: boolean;
  onClick?(e: MouseEvent<HTMLDivElement>): void;
}

const HideNavBarLogo = ({
  className,
  logo,
  isVisible,
  onClick,
}: HideNavBarLogoProps) => {
  const styleWithTheme = useWithTheme();

  return (
    <div
      className={cx(styleWithTheme(defaultStyles), "navbar-logo", className)}
    >
      <div
        className={cx("navbar-logo-container", {
          ["hide-logo"]: !isVisible,
        })}
        onClick={onClick}
      >
        <div className={"logo"}>
          {logo || <ConnectedIcon width={"2em"} height={"2em"} />}
        </div>
        {!!onClick && (
          <div className={cx("menu-logo")}>
            <MenuIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default HideNavBarLogo;
