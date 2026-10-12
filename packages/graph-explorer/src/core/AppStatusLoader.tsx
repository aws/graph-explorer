import { useQuery } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import {
  type PropsWithChildren,
  startTransition,
  Suspense,
  useEffect,
} from "react";

import { PanelEmptyState, PanelError, Spinner } from "@/components";
import { fetchDefaultConnection } from "@/connections";
import { logger } from "@/utils";

import { activeConnectionIdAtom, savedConnectionsAtom } from "./StateProvider";

function AppStatusLoader({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<PreparingEnvironment />}>
      <LoadDefaultConnection>{children}</LoadDefaultConnection>
    </Suspense>
  );
}

function LoadDefaultConnection({ children }: PropsWithChildren) {
  const setActiveConnectionId = useSetAtom(activeConnectionIdAtom);
  const [savedConnections, setSavedConnections] = useAtom(savedConnectionsAtom);

  // An empty store is what drives the whole default-connection flow: the query
  // fetches, the effect seeds, and the loading states show only while it holds.
  // Emptying the store (e.g. deleting the last connection) re-arms all three.
  const storeIsEmpty = savedConnections.size === 0;

  const defaultConnectionQuery = useQuery({
    queryKey: ["default-connection"],
    queryFn: () => fetchDefaultConnection(),
    staleTime: Infinity,
    enabled: storeIsEmpty,
  });

  const defaultConnections = defaultConnectionQuery.data;
  const hasDefaultConnection = Boolean(defaultConnections?.length);

  useEffect(() => {
    // Seed the default connection only into an empty store. The size guard lets
    // the effect settle after the write yet re-fire to re-add the default when
    // the last connection is deleted, instead of looping.
    if (!storeIsEmpty) {
      return;
    }

    if (!defaultConnections) {
      // Query hasn't run yet
      return;
    }

    if (!defaultConnections.length) {
      logger.debug("No default connections found");
      return;
    }

    startTransition(() => {
      logger.debug("Adding default connections", defaultConnections);
      setSavedConnections(prev => {
        const updatedConnections = new Map(prev);
        defaultConnections.forEach(connection => {
          updatedConnections.set(connection.id, connection);
        });
        return updatedConnections;
      });
      setActiveConnectionId(defaultConnections[0].id);
    });
  }, [
    storeIsEmpty,
    setActiveConnectionId,
    setSavedConnections,
    defaultConnections,
  ]);

  if (storeIsEmpty && defaultConnectionQuery.isLoading) {
    return (
      <PanelEmptyState
        title="Loading default connection..."
        subtitle="We are checking for a default connection"
        icon={<Spinner />}
      />
    );
  }

  if (storeIsEmpty && defaultConnectionQuery.isError) {
    return <PanelError error={defaultConnectionQuery.error} />;
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
