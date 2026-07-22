import { useQuery } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useEffect,
} from "react";

import { PanelEmptyState, Spinner } from "@/components";
import { logger } from "@/utils";

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
  const setActiveConfig = useSetAtom(activeConfigurationAtom);
  const [configuration, setConfiguration] = useAtom(configurationAtom);

  // An empty store is what drives the whole default-connection flow: the query
  // fetches, the effect seeds, and the loading states show only while it holds.
  // Emptying the store (e.g. deleting the last connection) re-arms all three.
  const storeIsEmpty = configuration.size === 0;

  const defaultConfigQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: fetchDefaultConnection,
    staleTime: Infinity,
    enabled: storeIsEmpty,
  });

  const defaultConnectionConfigs = defaultConfigQuery.data;
  const hasDefaultConnection = Boolean(defaultConnectionConfigs?.length);

  useEffect(() => {
    // Seed the default connection only into an empty store. The size guard lets
    // the effect settle after the write yet re-fire to re-add the default when
    // the last connection is deleted, instead of looping.
    if (!storeIsEmpty) {
      return;
    }

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
    storeIsEmpty,
    setActiveConfig,
    setConfiguration,
    defaultConnectionConfigs,
  ]);

  if (storeIsEmpty && defaultConfigQuery.isLoading) {
    return (
      <PanelEmptyState
        title="Loading default connection..."
        subtitle="We are checking for a default connection"
        icon={<Spinner />}
      />
    );
  }

  if (storeIsEmpty && hasDefaultConnection) {
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
