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
import { fetchDefaultStyling, resolveDefaultStyling } from "./defaultStyling";
import {
  activeConfigurationAtom,
  configurationAtom,
  defaultStylingAtom,
  mergeDefaultsIntoUserStyling,
  userStylingAtom,
} from "./StateProvider";

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
  const setDefaultStyling = useSetAtom(defaultStylingAtom);
  const setUserStyling = useSetAtom(userStylingAtom);

  const defaultConfigQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: fetchDefaultConnection,
    staleTime: Infinity,
    // Run the query only if the store is loaded and there are no configs
    enabled: configuration.size === 0,
  });

  // Fetch default styling on every session start
  const defaultStylingQuery = useQuery({
    queryKey: ["default-styling"],
    queryFn: fetchDefaultStyling,
    staleTime: Infinity,
  });

  useEffect(() => {
    const data = defaultStylingQuery.data;
    if (!data) {
      return;
    }
    let cancelled = false;
    logger.debug("Applying default styling", data);
    resolveDefaultStyling(data)
      .then(resolved => {
        if (!cancelled) {
          // Store reference copy for per-type "Reset to Default"
          setDefaultStyling(resolved);

          // Merge file values into user styling. Default values fill in
          // properties the user hasn't explicitly set; user overrides win.
          setUserStyling(prev => mergeDefaultsIntoUserStyling(prev, resolved));
        }
      })
      .catch(err => {
        logger.warn("Failed to resolve default styling", err);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultStylingQuery.data, setDefaultStyling, setUserStyling]);

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
