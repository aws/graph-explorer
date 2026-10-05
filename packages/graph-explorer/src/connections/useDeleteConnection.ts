import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import {
  activeConnectionIdAtom,
  allGraphSessionsAtom,
  savedConnectionsAtom,
  schemaAtom,
} from "@/core/StateProvider/storageAtoms";
import { logger } from "@/utils";

import type { ConnectionId } from "./types";

export function useDeleteConnection() {
  return useAtomCallback(
    useCallback((_get, set, id: ConnectionId) => {
      logger.log("Deleting connection:", id);
      set(activeConnectionIdAtom, prev => {
        if (prev === id) {
          return null;
        }
        return prev;
      });

      set(savedConnectionsAtom, prevConnections => {
        const updatedConnections = new Map(prevConnections);
        updatedConnections.delete(id);
        return updatedConnections;
      });

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        updatedSchemas.delete(id);
        return updatedSchemas;
      });

      set(allGraphSessionsAtom, prev => {
        const updatedGraphs = new Map(prev);
        updatedGraphs.delete(id);
        return updatedGraphs;
      });
    }, []),
  );
}

export function useDeleteActiveConnection() {
  const activeConnectionId = useAtomValue(activeConnectionIdAtom);
  const deleteConnection = useDeleteConnection();

  return () => {
    if (!activeConnectionId) {
      return;
    }

    deleteConnection(activeConnectionId);
  };
}
