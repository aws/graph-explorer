import type { PropsWithChildren } from "react";

import {
  NavBar,
  NavBarContent,
  NavBarTitle,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { LABELS } from "@/utils/constants";

/** The app shell around a connection link outcome, centered on the page. */
export function ConnectPageLayout({ children }: PropsWithChildren) {
  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle title={LABELS.APP_NAME} />
        </NavBarContent>
      </NavBar>
      <WorkspaceContent>
        <PanelGroup className="items-center justify-center p-4 sm:p-20">
          {children}
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}
