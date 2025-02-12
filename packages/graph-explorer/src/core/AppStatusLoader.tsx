import { PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router";
import { useRecoilState, useRecoilValue } from "recoil";
import { LoadingSpinner, PanelEmptyState } from "@/components";
import Redirect from "@/components/Redirect";
import { ConfigurationId, RawConfiguration } from "./ConfigurationProvider";
import {
  activeConfigurationAtom,
  configurationAtom,
  isStoreLoadedAtom,
} from "./StateProvider/configuration";
import { schemaAtom } from "./StateProvider/schema";
import useLoadStore from "./StateProvider/useLoadStore";
import { CONNECTIONS_OP } from "@/modules/CreateConnection/CreateConnection";
import { logger } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchDefaultConnection } from "./defaultConnection";
import { cloneDeep } from "lodash";

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

  const defaultConnectionConfig = defaultConfigQuery.data;

  useEffect(() => {
    if (!isStoreLoaded) {
      logger.debug("Store not loaded, skipping config load");
      return;
    }

    if (activeConfig && configuration.get(activeConfig)) {
      logger.debug("Active config exists, skipping config load");
      return;
    }

    // If the config file is not in the store,
    // update configuration with the config file
    if (
      !!defaultConnectionConfig &&
      !configuration.get(defaultConnectionConfig.id)
    ) {
      const newConfig: RawConfiguration = cloneDeep(defaultConnectionConfig);
      newConfig.__fileBase = true;
      let activeConfigId = defaultConnectionConfig.id;

      logger.debug("Adding new config to store", newConfig);
      setConfiguration(prevConfigMap => {
        const updatedConfig = new Map(prevConfigMap);
        if (newConfig.connection?.queryEngine) {
          updatedConfig.set(defaultConnectionConfig.id, newConfig);
        }
        //Set a configuration for each connection if queryEngine is not set
        if (!newConfig.connection?.queryEngine) {
          CONNECTIONS_OP.forEach(connection => {
            const connectionConfig = {
              ...newConfig,
              id: `${newConfig.id}-${connection.value}` as ConfigurationId,
              connection: {
                ...newConfig.connection,
                url: newConfig.connection?.url || "",
                queryEngine: connection.value,
              },
            };
            updatedConfig.set(connectionConfig.id, connectionConfig);
          });
          activeConfigId =
            `${newConfig.id}-${CONNECTIONS_OP[0].value}` as ConfigurationId;
        }
        return updatedConfig;
      });
      setActiveConfig(activeConfigId);
    }

    // If the config file is stored,
    // only activate the configuration
    if (
      !!defaultConnectionConfig &&
      configuration.get(defaultConnectionConfig.id)
    ) {
      logger.debug(
        "Config exists in store, activating",
        defaultConnectionConfig.id
      );
      setActiveConfig(defaultConnectionConfig.id);
    }
  }, [
    activeConfig,
    defaultConnectionConfig,
    configuration,
    isStoreLoaded,
    setActiveConfig,
    setConfiguration,
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
  if (configuration.size === 0 && !!defaultConnectionConfig) {
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
