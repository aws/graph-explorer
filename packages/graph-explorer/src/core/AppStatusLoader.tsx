import merge from "lodash/merge";
import { PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { LoadingSpinner, PanelEmptyState } from "../components";
import Redirect from "../components/Redirect";
import { RawConfiguration } from "./ConfigurationProvider";
import fetchConfiguration from "./ConfigurationProvider/fetchConfiguration";
import {
  activeConfigurationAtom,
  configurationAtom,
  isStoreLoadedAtom,
} from "./StateProvider/configuration";
import { schemaAtom } from "./StateProvider/schema";
import useLoadStore from "./StateProvider/useLoadStore";
import { CONNECTIONS_OP } from "../modules/CreateConnection/CreateConnection";

export type AppLoadingProps = {
  config?: RawConfiguration;
};

const STATUS = {
  STORE: {
    title: "Preparing environment...",
    subtitle: "We are loading all components",
  },
  CONFIG_FILE: {
    title: "Reading configuration...",
    subtitle: "We are loading the configuration from the file",
  },
};

const AppStatusLoader = ({
  config,
  children,
}: PropsWithChildren<AppLoadingProps>) => {
  const location = useLocation();
  useLoadStore();
  const isStoreLoaded = useRecoilValue(isStoreLoadedAtom);
  const [activeConfig, setActiveConfig] = useRecoilState(
    activeConfigurationAtom
  );
  const [configuration, setConfiguration] = useRecoilState(configurationAtom);
  const schema = useRecoilValue(schemaAtom);

  useEffect(() => {
    if (!isStoreLoaded) {
      return;
    }

    if (activeConfig && configuration.get(activeConfig)) {
      return;
    }

    // If the config file is not in the store,
    // update configuration with the config file
    if (!!config && !configuration.get(config.id)) {
      (async () => {
        let newConfig: RawConfiguration = config;
        if (config.remoteConfigFile) {
          const remoteConfig = await fetchConfiguration(
            config.remoteConfigFile
          );
          newConfig = merge({}, config, remoteConfig);
        }
        newConfig.__fileBase = true;
        let activeConfigId = config.id;
        setConfiguration(prevConfigMap => {
          const updatedConfig = new Map(prevConfigMap);
          if (newConfig.connection?.queryEngine) {
            updatedConfig.set(config.id, newConfig);
          }
          //Set a configuration for each connection if queryEngine is not set
          if (!newConfig.connection?.queryEngine) {
            CONNECTIONS_OP.forEach(connection => {
              const connectionConfig = {
                ...newConfig,
                id: `${newConfig.id}-${connection.value}`,
                connection: {
                  ...newConfig.connection,
                  url: newConfig.connection?.url || "",
                  queryEngine: connection.value,
                },
              };
              updatedConfig.set(connectionConfig.id, connectionConfig);
            });
            activeConfigId = `${newConfig.id}-${CONNECTIONS_OP[0].value}`;
          }
          return updatedConfig;
        });
        setActiveConfig(activeConfigId);
      })();

      return;
    }

    // If the config file is stored,
    // only activate the configuration
    if (!!config && configuration.get(config.id)) {
      setActiveConfig(config.id);
    }
  }, [
    activeConfig,
    config,
    configuration,
    isStoreLoaded,
    setActiveConfig,
    setConfiguration,
  ]);

  // Wait until state is recovered from the indexed DB
  if (!isStoreLoaded) {
    return (
      <PanelEmptyState
        title={STATUS.STORE.title}
        subtitle={STATUS.STORE.subtitle}
        icon={<LoadingSpinner />}
      />
    );
  }

  // Loading from config file if exists
  if (configuration.size === 0 && !!config) {
    return (
      <PanelEmptyState
        title={STATUS.CONFIG_FILE.title}
        subtitle={STATUS.CONFIG_FILE.subtitle}
        icon={<LoadingSpinner />}
      />
    );
  }

  // Force to be in Connections if no config is activated
  // even by changing the URL
  if (!activeConfig || !schema.get(activeConfig || "")?.lastUpdate) {
    if (!location.pathname.match(/\/connections/)) {
      return <Redirect to={"/connections"} />;
    }
  }

  return <>{children}</>;
};

export default AppStatusLoader;
