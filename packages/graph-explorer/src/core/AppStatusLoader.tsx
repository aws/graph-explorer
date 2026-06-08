import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useState,
  useEffect,
} from "react";

import { PanelEmptyState, Spinner } from "@/components";
import { logger } from "@/utils";

import { fetchDefaultConnection } from "./defaultConnection";
import { activeConfigurationAtom, configurationAtom } from "./StateProvider";
import { UrlConnectionDialog } from "./UrlConnectionDialog";
import {
  parseUrlConnectionParams,
  findMatchingConnection,
  buildConnectionFromParams,
} from "./urlConnectionParams";

// Read URL params once at module level
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
  const [urlHandled, setUrlHandled] = useState(!initialUrlParams);

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

  // Compute dialog state during render
  const existingMatch =
    !urlHandled && initialUrlParams
      ? findMatchingConnection(configuration, initialUrlParams)
      : null;
  const pendingConnection =
    !urlHandled && initialUrlParams && !existingMatch
      ? buildConnectionFromParams(initialUrlParams, window.location.origin)
      : null;

  function handleConfirm() {
    if (existingMatch) {
      logger.debug(
        "Activating matching connection from URL params",
        existingMatch.id,
      );
      startTransition(() => {
        setActiveConfig(existingMatch.id);
      });
    } else if (pendingConnection) {
      logger.debug("Adding connection from URL params", pendingConnection);
      startTransition(() => {
        setConfiguration(prev => {
          const updated = new Map(prev);
          updated.set(pendingConnection.id, pendingConnection);
          return updated;
        });
        setActiveConfig(pendingConnection.id);
      });
    }
    setUrlHandled(true);
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );
  }

  function handleCancel() {
    setUrlHandled(true);
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );
  }

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
      <UrlConnectionDialog
        open={!urlHandled && !!initialUrlParams}
        connection={existingMatch ?? pendingConnection}
        isExisting={!!existingMatch}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
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
