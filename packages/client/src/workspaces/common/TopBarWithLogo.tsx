import { css } from "@emotion/css";
import { PropsWithChildren } from "react";
import NeptuneIcon from "../../components/icons/NeptuneIcon";
import Workspace from "../../components/Workspace";

const TopBarWithLogo = ({ children }: PropsWithChildren<any>) => {
  return (
    <Workspace.TopBar
      logoVisible={true}
      logo={<NeptuneIcon width={"2em"} height={"2em"} />}
      className={css`
        .ft-navbar-logo-container {
          background: linear-gradient(225deg, #4d72f2 12.15%, #3334b9 87.02%);
        }
      `}
    >
      {children}
    </Workspace.TopBar>
  );
};

TopBarWithLogo.displayName = "WorkspaceTopBar";

export default TopBarWithLogo;
