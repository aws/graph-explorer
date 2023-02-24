import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import { groupChildrenByType } from "../../../utils";
import styles from "../Workspace.styles";
import type { HideNavBarLogoProps } from "./HideNavBarLogo";
import HideNavBarLogo from "./HideNavBarLogo";
import WorkspaceTopBarAdditionalControls from "./WorkspaceTopBarAdditionalControls";
import WorkspaceTopBarContent from "./WorkspaceTopBarContent";
import WorkspaceTopBarTitle from "./WorkspaceTopBarTitle";
import WorkspaceTopBarToggles from "./WorkspaceTopBarToggles";
import WorkspaceTopBarVersion from "./WorkspaceTopBarVersion";

export type WorkspaceTopBarProps = {
  className?: string;
  classNamePrefix?: string;
  logo?: HideNavBarLogoProps["logo"];
  logoVisible?: HideNavBarLogoProps["logo"];
  onLogoClick?: HideNavBarLogoProps["onClick"];
};

interface WorkspaceTopBarComposition {
  Title: typeof WorkspaceTopBarTitle;
  Toggles: typeof WorkspaceTopBarToggles;
  AdditionalControls: typeof WorkspaceTopBarAdditionalControls;
  Content: typeof WorkspaceTopBarContent;
  Version: typeof WorkspaceTopBarVersion;
}

const WorkspaceTopBar = ({
  className,
  classNamePrefix,
  children,
  logo,
  logoVisible,
  onLogoClick,
}: PropsWithChildren<WorkspaceTopBarProps>) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix || "ft");

  const childrenByType = useMemo(
    () =>
      groupChildrenByType(
        children,
        [
          WorkspaceTopBarTitle.displayName || WorkspaceTopBarTitle.name,
          WorkspaceTopBarToggles.displayName || WorkspaceTopBarToggles.name,
          WorkspaceTopBarContent.displayName || WorkspaceTopBarContent.name,
          WorkspaceTopBarAdditionalControls.displayName ||
            WorkspaceTopBarAdditionalControls.name,
          WorkspaceTopBarVersion.displayName || WorkspaceTopBarVersion.name,
        ],
        "rest"
      ),
    [children]
  );
  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarSectionStyles),
        pfx("top-bar-container"),
        className
      )}
    >
      <div className={stylesWithTheme(styles.mainBarStyles)}>
        <HideNavBarLogo
          logo={logo}
          isVisible={!!logoVisible}
          onClick={onLogoClick}
        />
        {
          childrenByType[
            WorkspaceTopBarTitle.displayName || WorkspaceTopBarTitle.name
          ]
        }
        <div className={pfx("space")} />
        {
          childrenByType[
            WorkspaceTopBarContent.displayName || WorkspaceTopBarContent.name
          ]
        }
        <div className={pfx("space")} />
        {
          childrenByType[
            WorkspaceTopBarVersion.displayName || WorkspaceTopBarVersion.name
          ]
        }
        {
          childrenByType[
            WorkspaceTopBarToggles.displayName || WorkspaceTopBarToggles.name
          ]
        }
        {
          childrenByType[
            WorkspaceTopBarAdditionalControls.displayName ||
              WorkspaceTopBarAdditionalControls.name
          ]
        }
      </div>
      <div
        className={cx(
          stylesWithTheme(styles.subBarStyles),
          pfx("sub-bar-container")
        )}
      >
        {childrenByType.rest}
      </div>
    </div>
  );
};

WorkspaceTopBar.displayName = "WorkspaceTopBar";

WorkspaceTopBar.Title = WorkspaceTopBarTitle;
WorkspaceTopBar.Toggles = WorkspaceTopBarToggles;
WorkspaceTopBar.AdditionalControls = WorkspaceTopBarAdditionalControls;
WorkspaceTopBar.Content = WorkspaceTopBarContent;
WorkspaceTopBar.Version = WorkspaceTopBarVersion;

export default WorkspaceTopBar as ((
  props: PropsWithChildren<WorkspaceTopBarProps>
) => ReactElement) &
  WorkspaceTopBarComposition & { displayName: string };
