import type { VariantProps } from "cva";

import {
  CompassIcon,
  DatabaseIcon,
  NetworkIcon,
  SettingsIcon,
  TableIcon,
} from "lucide-react";
import { Link } from "react-router";

import { useHasActiveSchema } from "@/core";
import { cn } from "@/utils";

import { buttonStyles } from "./Button";
import NotInProduction from "./NotInProduction";

type RouteButtonProps = {
  variant?: VariantProps<typeof buttonStyles>["variant"];
};

export function ConnectionsRouteButton({ variant }: RouteButtonProps) {
  return (
    <Link to="/connections" className={cn(buttonStyles({ variant }))}>
      <DatabaseIcon />
      Connections
    </Link>
  );
}

export function SettingsRouteButton({ variant }: RouteButtonProps) {
  return (
    <Link to="/settings/general" className={cn(buttonStyles({ variant }))}>
      <SettingsIcon />
      Settings
    </Link>
  );
}

export function GraphExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <Link
      to={hasSchema ? "/graph-explorer" : "/connections"}
      className={cn(buttonStyles({ variant }))}
      aria-disabled={!hasSchema}
    >
      <CompassIcon />
      Graph Explorer
    </Link>
  );
}

export function DataExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <Link
      to={hasSchema ? "/data-explorer" : "/connections"}
      className={cn(buttonStyles({ variant }))}
      aria-disabled={!hasSchema}
    >
      <TableIcon />
      Data Explorer
    </Link>
  );
}

export function SchemaExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <NotInProduction>
      <Link
        to={hasSchema ? "/schema-explorer" : "/connections"}
        className={cn(buttonStyles({ variant }))}
        aria-disabled={!hasSchema}
      >
        <NetworkIcon />
        Schema Explorer
      </Link>
    </NotInProduction>
  );
}
