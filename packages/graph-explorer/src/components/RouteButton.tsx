import type { ComponentPropsWithRef } from "react";

import {
  CompassIcon,
  DatabaseIcon,
  NetworkIcon,
  SettingsIcon,
  TableIcon,
} from "lucide-react";

import { NavButton } from "./Button";

type RouteButtonProps = Omit<
  ComponentPropsWithRef<typeof NavButton>,
  "to" | "navOptions"
>;

export function ConnectionsRouteButton(props: RouteButtonProps) {
  return (
    <NavButton to="/connections" {...props}>
      <DatabaseIcon />
      Connections
    </NavButton>
  );
}

export function SettingsRouteButton(props: RouteButtonProps) {
  return (
    <NavButton to="/settings/general" {...props}>
      <SettingsIcon />
      Settings
    </NavButton>
  );
}

export function GraphExplorerRouteButton(props: RouteButtonProps) {
  return (
    <NavButton to="/graph-explorer" {...props}>
      <CompassIcon />
      Graph Explorer
    </NavButton>
  );
}

export function DataExplorerRouteButton(props: RouteButtonProps) {
  return (
    <NavButton to="/data-explorer" {...props}>
      <TableIcon />
      Data Explorer
    </NavButton>
  );
}

export function SchemaExplorerRouteButton(props: RouteButtonProps) {
  return (
    <NavButton to="/schema-explorer" {...props}>
      <NetworkIcon />
      Schema Explorer
    </NavButton>
  );
}
