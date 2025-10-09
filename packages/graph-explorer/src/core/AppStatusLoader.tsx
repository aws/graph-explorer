import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useEffect,
} from "react";
import { useLocation } from "react-router";
import { PanelEmptyState, Spinner } from "@/components";
import Redirect from "@/components/Redirect";
import {
  activeConfigurationAsyncAtom,
  configurationAsyncAtom,
} from "./StateProvider/configuration";
import { schemaAsyncAtom } from "./StateProvider/schema";
import { logger } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchDefaultConnection } from "./defaultConnection";
import { useAtom, useAtomValue } from "jotai";

function AppStatusLoader({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<PreparingEnvironment />}>
      <LoadDefaultConfig>{children}</LoadDefaultConfig>
    </Suspense>
  );
}

function LoadDefaultConfig({ children }: PropsWithChildren) {
  const location = useLocation();

  const [activeConfig, setActiveConfig] = useAtom(activeConfigurationAsyncAtom);
  const [configuration, setConfiguration] = useAtom(configurationAsyncAtom);
  const schema = useAtomValue(schemaAsyncAtom);

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
      setConfiguration(async prev => {
        const updatedConfig = new Map(await prev);
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

  // Force to be in Connections if no config is activated
  // even by changing the URL
  if (!activeConfig || !schema.get(activeConfig || "")?.lastUpdate) {
    if (
      !location.pathname.match(/\/connections/) &&
      !location.pathname.match(/\/settings/)
    ) {
      logger.debug("Redirecting to connections because no config is active", {
        activeConfig,
        schema,
      });

      return <Redirect to="/connections" />;
    }
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
