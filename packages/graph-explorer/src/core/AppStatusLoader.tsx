import { PropsWithChildren, startTransition, useEffect } from "react";
import { useLocation } from "react-router";
import { useRecoilState, useRecoilValue } from "recoil";
import { LoadingSpinner, PanelEmptyState } from "@/components";
import Redirect from "@/components/Redirect";
import {
  activeConfigurationAtom,
  configurationAtom,
  isStoreLoadedAtom,
} from "./StateProvider/configuration";
import { schemaAtom } from "./StateProvider/schema";
import useLoadStore from "./StateProvider/useLoadStore";
import { logger } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchDefaultConnection } from "./defaultConnection";

const AppStatusLoader = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  useLoadStore();
  const isStoreLoaded = useRecoilValue(isStoreLoadedAtom);
  const [activeConfig, setActiveConfig] = useRecoilState(
    activeConfigurationAtom
  );
  const [configuration, setConfiguration] = useRecoilState(configurationAtom);
  const schema = useRecoilValue(schemaAtom);

  const defaultConfigQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: fetchDefaultConnection,
    staleTime: Infinity,
    // Run the query only if the store is loaded and there are no configs
    enabled: isStoreLoaded && configuration.size === 0,
  });

  const defaultConnectionConfigs = defaultConfigQuery.data;

  useEffect(() => {
    if (!isStoreLoaded) {
      logger.debug("Store not loaded, skipping default connection load");
      return;
    }

    if (configuration.size > 0) {
      logger.debug(
        "Connections already exist, skipping default connection load"
      );
      return;
    }

    if (!defaultConnectionConfigs?.length) {
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
    isStoreLoaded,
    setActiveConfig,
    setConfiguration,
    defaultConnectionConfigs,
  ]);

  // Wait until state is recovered from the indexed DB
  if (!isStoreLoaded) {
    return (
      <PanelEmptyState
        title="Preparing environment..."
        subtitle="We are loading all components"
        icon={<LoadingSpinner />}
      />
    );
  }

  if (configuration.size === 0 && defaultConfigQuery.isLoading) {
    return (
      <PanelEmptyState
        title="Loading default connection..."
        subtitle="We are checking for a default connection"
        icon={<LoadingSpinner />}
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
        icon={<LoadingSpinner />}
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
      return <Redirect to="/connections" />;
    }
  }

  return <>{children}</>;
};

export default AppStatusLoader;
