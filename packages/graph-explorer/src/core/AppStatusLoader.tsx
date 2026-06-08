import type { QueryEngine, NeptuneServiceType } from "@shared/types";

import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useEffect,
} from "react";

import { PanelEmptyState, Spinner } from "@/components";
import { logger } from "@/utils";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import { fetchDefaultConnection } from "./defaultConnection";
import { activeConfigurationAtom, configurationAtom } from "./StateProvider";

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

  const defaultConfigQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: fetchDefaultConnection,
    staleTime: Infinity,
    // Run the query only if the store is loaded and there are no configs
    enabled: configuration.size === 0,
  });

  const defaultConnectionConfigs = defaultConfigQuery.data;

  useEffect(() => {
    if (!defaultConnectionConfigs) {
      // Query hasn't run yet
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

  // Process URL connection parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const graphDbUrl = params.get("graphDbUrl");
    if (!graphDbUrl) return;

    const queryEngine = params.get("queryEngine") ?? "gremlin";
    const awsRegion = params.get("awsRegion") ?? "";
    const serviceType = params.get("serviceType") ?? "";
    const name = params.get("name") ?? graphDbUrl;

    // Check for existing connection with same graphDbUrl + queryEngine
    const existingMatch = Array.from(configuration.values()).find(
      c =>
        c.connection?.graphDbUrl?.toLowerCase() === graphDbUrl.toLowerCase() &&
        c.connection?.queryEngine === queryEngine,
    );

    if (existingMatch) {
      logger.debug(
        "Found matching connection from URL params",
        existingMatch.id,
      );
      startTransition(() => {
        setActiveConfig(existingMatch.id);
      });
    } else {
      const id = `url-${graphDbUrl}-${queryEngine}` as ConfigurationId;
      const newConnection: RawConfiguration = {
        id,
        displayLabel: name,
        connection: {
          url: window.location.origin,
          queryEngine: queryEngine as QueryEngine,
          proxyConnection: true,
          graphDbUrl,
          awsAuthEnabled: !!(awsRegion && serviceType),
          awsRegion,
          serviceType: (serviceType || undefined) as
            | NeptuneServiceType
            | undefined,
        },
      };

      startTransition(() => {
        logger.debug("Adding connection from URL params", newConnection);
        setConfiguration(prev => {
          const updated = new Map(prev);
          updated.set(id, newConnection);
          return updated;
        });
        setActiveConfig(id);
      });
    }

    // Strip URL params
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );
  }, [configuration, setConfiguration, setActiveConfig]);

  if (configuration.size === 0 && defaultConfigQuery.isLoading) {
    return (
      <PanelEmptyState
        title="Loading default connection..."
        subtitle="We are checking for a default connection"
        icon={<Spinner />}
      />
    );
  }

  // Loading from config file if exists
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

  return <>{children}</>;
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
