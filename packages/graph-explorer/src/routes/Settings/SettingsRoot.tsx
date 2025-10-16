import Workspace from "@/components/Workspace/Workspace";
import {
  buttonStyles,
  DatabaseIcon,
  ForwardIcon,
  Panel,
  PanelContent,
} from "@/components";
import { Link, NavLink, Outlet, To } from "react-router";
import { PropsWithChildren, Suspense } from "react";
import AppLoadingPage from "@/core/AppLoadingPage";
import { cn } from "@/utils";
import { LABELS } from "@/utils/constants";

export default function SettingsRoot() {
  return (
    <Workspace orientation="horizontal">
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title title={`${LABELS.APP_NAME} Settings`} />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <Link
            to="/connections"
            className={cn(buttonStyles({ variant: "filled" }))}
          >
            <DatabaseIcon />
            Open Connections
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <Panel className="min-w-[16rem]">
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
      </Workspace.Content>
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
            "bg-primary-main text-primary-contrastText hover:bg-primary-light font-bold",
          !isActive && "text-text-secondary font-base hover:bg-gray-200"
        )
      }
    >
      <ForwardIcon className="h-6 w-6" />
      {props.children}
    </NavLink>
  );
}
