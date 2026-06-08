import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useEffect,
  useState,
} from "react";

import { PanelEmptyState, Spinner } from "@/components";
import { Button } from "@/components/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/Dialog";
import { logger } from "@/utils";

import { fetchDefaultConnection } from "./defaultConnection";
import { activeConfigurationAtom, configurationAtom } from "./StateProvider";
import {
  parseUrlConnectionParams,
  findMatchingConnection,
  buildConnectionFromParams,
} from "./urlConnectionParams";

// Read URL params once at module level (before any render)
const initialUrlParams = parseUrlConnectionParams(window.location.search);

function AppStatusLoader({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<PreparingEnvironment />}>
      <LoadDefaultConfig>{children}</LoadDefaultConfig>
    </Suspense>
  );
}

function LoadDefaultConfig({ children }: PropsWithChildren) {
  const [activeConfig, setActiveConfig] = useAtom(activeConfigurationAtom);
  const [configuration, setConfiguration] = useAtom(configurationAtom);
  const [urlHandled, setUrlHandled] = useState(false);

  const defaultConfigQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: fetchDefaultConnection,
    staleTime: Infinity,
    enabled: configuration.size === 0,
  });

  const defaultConnectionConfigs = defaultConfigQuery.data;

  useEffect(() => {
    if (!defaultConnectionConfigs) {
      return;
    }

    if (!defaultConnectionConfigs.length) {
      logger.debug("No default connections found");
      return;
    }

    startTransition(() => {
      logger.debug("Adding default connections", defaultConnectionConfigs);
      setConfiguration(prev => {
        const updatedConfig = new Map(prev);
        defaultConnectionConfigs.forEach(config => {
          updatedConfig.set(config.id, config);
        });
        return updatedConfig;
      });
      setActiveConfig(defaultConnectionConfigs[0].id);
    });
  }, [
    activeConfig,
    configuration,
    setActiveConfig,
    setConfiguration,
    defaultConnectionConfigs,
  ]);

  // Handle existing match activation via effect
  useEffect(() => {
    if (urlHandled || !initialUrlParams) return;

    const existingMatch = findMatchingConnection(
      configuration,
      initialUrlParams,
    );
    if (!existingMatch) return;

    logger.debug("Found matching connection from URL params", existingMatch.id);
    startTransition(() => {
      setUrlHandled(true);
      setActiveConfig(existingMatch.id);
    });
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );
  }, [urlHandled, configuration, setActiveConfig]);

  // Determine if we need to show the dialog
  const existingMatch = initialUrlParams
    ? findMatchingConnection(configuration, initialUrlParams)
    : null;
  const pendingConnection =
    initialUrlParams && !existingMatch && !urlHandled
      ? buildConnectionFromParams(initialUrlParams, window.location.origin)
      : null;

  if (configuration.size === 0 && defaultConfigQuery.isLoading) {
    return (
      <PanelEmptyState
        title="Loading default connection..."
        subtitle="We are checking for a default connection"
        icon={<Spinner />}
      />
    );
  }

  if (
    configuration.size === 0 &&
    defaultConnectionConfigs &&
    defaultConnectionConfigs.length > 0
  ) {
    return (
      <PanelEmptyState
        title="Reading configuration..."
        subtitle="We are loading the configuration from the file"
        icon={<Spinner />}
      />
    );
  }

  return (
    <>
      {children}
      <Dialog
        open={!!pendingConnection}
        onOpenChange={open => {
          if (!open) {
            setUrlHandled(true);
            window.history.replaceState(
              {},
              "",
              window.location.pathname + window.location.hash,
            );
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Connection</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {pendingConnection && (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {pendingConnection.displayLabel}
                </p>
                <p>
                  <span className="font-medium">Endpoint:</span>{" "}
                  {pendingConnection.connection?.graphDbUrl}
                </p>
                <p>
                  <span className="font-medium">Query Engine:</span>{" "}
                  {pendingConnection.connection?.queryEngine}
                </p>
                {pendingConnection.connection?.awsRegion && (
                  <p>
                    <span className="font-medium">Region:</span>{" "}
                    {pendingConnection.connection.awsRegion}
                  </p>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setUrlHandled(true);
                window.history.replaceState(
                  {},
                  "",
                  window.location.pathname + window.location.hash,
                );
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!pendingConnection) return;
                setUrlHandled(true);
                startTransition(() => {
                  logger.debug(
                    "Adding connection from URL params",
                    pendingConnection,
                  );
                  setConfiguration(prev => {
                    const updated = new Map(prev);
                    updated.set(pendingConnection.id, pendingConnection);
                    return updated;
                  });
                  setActiveConfig(pendingConnection.id);
                });
                window.history.replaceState(
                  {},
                  "",
                  window.location.pathname + window.location.hash,
                );
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PreparingEnvironment() {
  return (
    <PanelEmptyState
      title="Preparing environment..."
      subtitle="We are loading all components"
      icon={<Spinner />}
    />
  );
}

export default AppStatusLoader;
