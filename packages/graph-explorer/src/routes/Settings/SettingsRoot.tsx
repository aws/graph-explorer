import {
  buttonStyles,
  DatabaseIcon,
  ForwardIcon,
  NavBar,
  NavBarContent,
  NavBarActions,
  NavBarTitle,
  NavBarVersion,
  Panel,
  PanelContent,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { Link, NavLink, Outlet, type To } from "react-router";
import { type PropsWithChildren, Suspense } from "react";
import AppLoadingPage from "@/core/AppLoadingPage";
import { cn } from "@/utils";
import { LABELS } from "@/utils/constants";

export default function SettingsRoot() {
  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle title={`${LABELS.APP_NAME} Settings`} />
        </NavBarContent>

        <NavBarActions>
          <NavBarVersion>{__GRAPH_EXP_VERSION__}</NavBarVersion>
          <Link
            to="/connections"
            className={cn(buttonStyles({ variant: "filled" }))}
          >
            <DatabaseIcon />
            Open Connections
          </Link>
        </NavBarActions>
      </NavBar>
      <WorkspaceContent>
        <PanelGroup>
          <Panel className="min-w-64">
            <PanelContent className="px-3 py-6">
              <SideBar />
            </PanelContent>
          </Panel>
          <Panel className="w-full grow">
            <PanelContent className="p-6">
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
    <nav role="navigation">
      <ul className="flex w-full flex-col gap-1">
        <li>
          <SideBarItem to="general">General</SideBarItem>
        </li>
        <li>
          <SideBarItem to="about">About</SideBarItem>
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
          "flex w-full flex-row items-center rounded-md px-2 py-1 text-lg",
          isActive &&
            "bg-primary-main hover:bg-primary-light font-bold text-white",
          !isActive && "font-base text-text-secondary hover:bg-gray-200",
        )
      }
    >
      <ForwardIcon className="h-6 w-6" />
      {props.children}
    </NavLink>
  );
}
