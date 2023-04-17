import { css } from "@emotion/css";
import { PropsWithChildren } from "react";
import ApothecaLogo from "../../components/icons/ApothecaLogo";
//import GraphExplorerIcon from "../../components/icons/GraphExplorerIcon";
import Workspace from "../../components/Workspace";

const TopBarWithLogo = ({ children }: PropsWithChildren<any>) => {
  return (
    <Workspace.TopBar
      logoVisible={true}
      logo={<ApothecaLogo width={"2em"} height={"2em"} />}
      className={css`
        .ft-navbar-logo-container {
          background: linear-gradient(225deg, #4d72f2 12.15%, #3334b9 87.02%);
        }
      `}
    >  
      {children}
      <Workspace.TopBar.Version>{__GRAPH_EXP_VERSION__}</Workspace.TopBar.Version>
    </Workspace.TopBar>
  );
};

TopBarWithLogo.displayName = "WorkspaceTopBar";

export default TopBarWithLogo;
