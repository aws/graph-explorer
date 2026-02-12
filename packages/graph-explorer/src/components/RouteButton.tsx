import type { ComponentPropsWithRef } from "react";

import { MenuIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/utils";

import { Button, NavButton } from "./Button";
import Divider from "./Divider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { NavBarActions, NavBarVersion } from "./NavBar";

const allRoutes = {
  "graph-explorer": { name: "Graph", path: "/graph-explorer" },
  "data-explorer": { name: "Data Table", path: "/data-explorer" },
  "schema-explorer": { name: "Schema", path: "/schema-explorer" },
  connections: { name: "Connections", path: "/connections" },
  settings: { name: "Settings", path: "/settings/general" },
} as const;

// Split out settings so it can be laid out differently
const { settings: settingsRoute, ...mainRoutes } = allRoutes;

type RouteKey = keyof typeof allRoutes;

export function RouteButtonGroup({ active }: { active: RouteKey }) {
  return (
    <>
      <NavBarActions className="hidden lg:flex">
        <div className="flex gap-2">
          {Object.entries(mainRoutes).map(([key, route]) => (
            <RouteButton key={key} to={route.path} active={active === key}>
              {route.name}
            </RouteButton>
          ))}
        </div>

        <Divider axis="vertical" className="h-6" />

        <div className="flex h-full items-center gap-2">
          <RouteButton
            tooltip={settingsRoute.name}
            size="icon"
            to={settingsRoute.path}
            active={active === "settings"}
          >
            <SettingsIcon />
            <span className="sr-only">{settingsRoute.name}</span>
          </RouteButton>
          <NavBarVersion />
        </div>
      </NavBarActions>
      <NavBarActions className="lg:hidden">
        <NavBarVersion />
        <NavMenu />
      </NavBarActions>
    </>
  );
}

function NavMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" tooltip="Navigation">
          <MenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuGroup>
          {Object.entries(allRoutes).map(([key, route]) => (
            <DropdownMenuItem key={key} asChild>
              <Link to={route.path}>{route.name}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RouteButton({
  active,
  className,
  ...props
}: ComponentPropsWithRef<typeof NavButton> & { active: boolean }) {
  return (
    <NavButton
      variant="ghost"
      size="default"
      data-active={active || undefined}
      className={cn(
        "text-foreground hover:text-primary-foreground data-active:bg-primary hover:data-active:bg-primary-hover cursor-pointer rounded-full transition-all hover:bg-transparent data-active:text-white",
        className,
      )}
      {...props}
    />
  );
}
