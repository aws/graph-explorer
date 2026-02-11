import type { ComponentPropsWithRef } from "react";

import { cva } from "cva";
import { SettingsIcon } from "lucide-react";

import { cn } from "@/utils";

import { NavButton } from "./Button";
import Divider from "./Divider";
import { NavBarActions, NavBarVersion } from "./NavBar";

type GraphExplorerRoutes =
  | "connections"
  | "settings"
  | "graph-explorer"
  | "data-explorer"
  | "schema-explorer";

export function RouteButtonGroup({ active }: { active: GraphExplorerRoutes }) {
  return (
    <NavBarActions>
      <div className="flex gap-6">
        <RouteButton to="/graph-explorer" active={active === "graph-explorer"}>
          Graph
        </RouteButton>
        <RouteButton to="/data-explorer" active={active === "data-explorer"}>
          Data Table
        </RouteButton>
        <RouteButton
          to="/schema-explorer"
          active={active === "schema-explorer"}
        >
          Schema
        </RouteButton>
        <RouteButton to="/connections" active={active === "connections"}>
          Connections
        </RouteButton>
      </div>

      <Divider axis="vertical" className="h-6" />

      <div className="flex h-full items-center gap-2">
        <RouteButton
          tooltip="Settings"
          size="icon"
          to="/settings/general"
          active={active === "settings"}
        >
          <SettingsIcon />
          <span className="sr-only">Settings</span>
        </RouteButton>
        <NavBarVersion />
      </div>
    </NavBarActions>
  );
}

/*
 * DEV NOTE:
 * Keeping these three styles in the code for now since we are still trying to decide which style to go with.
 *
 * Once a style decision is made we can remove these to focus on a single style for the route button.
 */
const routeButtonStyles = cva({
  base: "text-foreground hover:text-primary-foreground cursor-pointer transition-all hover:bg-transparent",
  variants: {
    variant: {
      rounded:
        "data-active:bg-primary-subtle data-active:text-primary-foreground data-active:ring-primary-foreground hover:data-active:bg-primary-subtle-hover rounded-full data-active:ring",
      roundedFill:
        "data-active:bg-primary hover:data-active:bg-primary-hover rounded-full data-active:text-white",
      underlined:
        "data-active:text-foreground hover:text-primary-foreground decoration-primary-foreground text-muted-foreground font-base decoration-3 underline-offset-6 data-active:bg-transparent data-active:font-bold data-active:underline",
    },
  },
  defaultVariants: {
    variant: "roundedFill",
  },
});

function RouteButton({
  active,
  className,
  ...props
}: ComponentPropsWithRef<typeof NavButton> & { active: boolean }) {
  return (
    <NavButton
      variant="ghost"
      size="default"
      data-active={active ? true : undefined}
      className={cn(routeButtonStyles(), className)}
      {...props}
    />
  );
}
