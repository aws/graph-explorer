import { CogIcon, InfoIcon, SwatchBookIcon } from "lucide-react";
import { type PropsWithChildren, Suspense } from "react";
import { NavLink, Outlet, type To } from "react-router";

import {
  NavBar,
  NavBarContent,
  NavBarTitle,
  Panel,
  PanelContent,
  PanelGroup,
  RouteButtonGroup,
  PersistenceStatusIndicator,
  Workspace,
  WorkspaceContent,
} from "@/components";
import AppLoadingPage from "@/core/AppLoadingPage";
import { cn } from "@/utils";
import { LABELS } from "@/utils/constants";

export default function SettingsRoot() {
  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle title={`${LABELS.APP_NAME} Settings`} />
          <PersistenceStatusIndicator />
        </NavBarContent>

        <RouteButtonGroup active="settings" />
      </NavBar>
      <WorkspaceContent>
        <PanelGroup>
          <Panel className="min-w-64">
            <PanelContent className="px-4 py-6">
              <SideBar />
            </PanelContent>
          </Panel>
          <Panel className="w-full grow">
            <PanelContent className="px-12 py-12 max-md:px-4">
              <Suspense fallback={<AppLoadingPage />}>
                <Outlet />
              </Suspense>
            </PanelContent>
          </Panel>
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}

function SideBar() {
  return (
    <nav className="space-y-4">
      <p className="text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
        Settings
      </p>
      <ul className="flex w-full flex-col gap-1">
        <li>
          <SideBarItem to="general">
            <CogIcon />
            General
          </SideBarItem>
        </li>
        <li>
          <SideBarItem to="styles">
            <SwatchBookIcon />
            Styles
          </SideBarItem>
        </li>
        <li>
          <SideBarItem to="about">
            <InfoIcon />
            About
          </SideBarItem>
        </li>
      </ul>
    </nav>
  );
}

function SideBarItem(props: PropsWithChildren<{ to: To }>) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        cn(
          "flex w-full flex-row items-center gap-2 rounded-lg px-3 py-2 text-base tracking-wide [&_svg]:size-4.5",
          isActive && "bg-primary text-white",
          !isActive && "text-foreground hover:bg-neutral-subtle",
        )
      }
    >
      {props.children}
    </NavLink>
  );
}
