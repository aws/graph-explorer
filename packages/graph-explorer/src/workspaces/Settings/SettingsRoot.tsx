import Workspace from "@/components/Workspace/Workspace";
import {
  Button,
  DatabaseIcon,
  ForwardIcon,
  ModuleContainer,
  ModuleContainerContent,
} from "@/components";
import { Link, NavLink, Outlet, To } from "react-router-dom";
import { PropsWithChildren, Suspense } from "react";
import AppLoadingPage from "@/core/AppLoadingPage";
import { cx } from "@emotion/css";
import { APP_NAME } from "@/utils/constants";

export default function SettingsRoot() {
  return (
    <Workspace orientation="horizontal">
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title title={`${APP_NAME} Settings`} />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <Link to="/connections">
            <Button icon={<DatabaseIcon />} variant="filled">
              Open Connections
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>
      <Workspace.Content>
        <ModuleContainer className="min-w-[16rem]">
          <ModuleContainerContent className="px-3 py-6">
            <SideBar />
          </ModuleContainerContent>
        </ModuleContainer>
        <ModuleContainer className="w-full grow">
          <ModuleContainerContent className="p-6">
            <Suspense fallback={<AppLoadingPage />}>
              <Outlet />
            </Suspense>
          </ModuleContainerContent>
        </ModuleContainer>
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
        cx(
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
