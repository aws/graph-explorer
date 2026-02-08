import {
  CompassIcon,
  DatabaseIcon,
  NetworkIcon,
  SettingsIcon,
  TableIcon,
} from "lucide-react";
import { Link } from "react-router";

import { useHasActiveSchema } from "@/core";

import { Button, type ButtonProps } from "./Button";

type RouteButtonProps = {
  variant?: ButtonProps["variant"];
};

export function ConnectionsRouteButton({ variant }: RouteButtonProps) {
  return (
    <Button variant={variant} asChild>
      <Link to="/connections">
        <DatabaseIcon />
        Connections
      </Link>
    </Button>
  );
}

export function SettingsRouteButton({ variant }: RouteButtonProps) {
  return (
    <Button variant={variant} asChild>
      <Link to="/settings/general">
        <SettingsIcon />
        Settings
      </Link>
    </Button>
  );
}

export function GraphExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <Button variant={variant} asChild>
      <Link
        to={hasSchema ? "/graph-explorer" : "/connections"}
        aria-disabled={!hasSchema}
      >
        <CompassIcon />
        Graph Explorer
      </Link>
    </Button>
  );
}

export function DataExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <Button variant={variant} asChild>
      <Link
        to={hasSchema ? "/data-explorer" : "/connections"}
        aria-disabled={!hasSchema}
      >
        <TableIcon />
        Data Explorer
      </Link>
    </Button>
  );
}

export function SchemaExplorerRouteButton({ variant }: RouteButtonProps) {
  const hasSchema = useHasActiveSchema();
  return (
    <Button variant={variant} asChild>
      <Link
        to={hasSchema ? "/schema-explorer" : "/connections"}
        aria-disabled={!hasSchema}
      >
        <NetworkIcon />
        Schema Explorer
      </Link>
    </Button>
  );
}
