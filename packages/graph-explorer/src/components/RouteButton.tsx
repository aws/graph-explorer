import type { VariantProps } from "cva";

import {
  CompassIcon,
  DatabaseIcon,
  SettingsIcon,
  TableIcon,
} from "lucide-react";
import { Link } from "react-router";

import { useHasActiveSchema } from "@/core";
import { cn } from "@/utils";

import { buttonStyles } from "./Button";

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
      to={!hasSchema ? "/connections" : "/graph-explorer"}
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
      to={!hasSchema ? "/connections" : "/data-explorer"}
      className={cn(buttonStyles({ variant }))}
      aria-disabled={!hasSchema}
    >
      <TableIcon />
      Data Explorer
    </Link>
  );
}
