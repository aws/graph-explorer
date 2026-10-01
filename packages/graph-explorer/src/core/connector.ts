import { atom, useAtomValue } from "jotai";

import type { Explorer } from "@/connector/useGEFetchTypes";

import { activeConnectionAtom } from "@/connections";
import { emptyExplorer } from "@/connector/emptyExplorer";
import { createGremlinExplorer } from "@/connector/gremlin/gremlinExplorer";
import { ServerLoggerConnector } from "@/connector/LoggerConnector";
import { createOpenCypherExplorer } from "@/connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "@/connector/sparql/sparqlExplorer";
import { logger } from "@/utils";

import { featureFlagsSelector } from "./StateProvider";

export const explorerAtom = atom(get => {
  const explorerForTesting = get(explorerForTestingAtom);
  if (explorerForTesting) {
    return explorerForTesting;
  }
  const connection = get(activeConnectionAtom);
  if (!connection) {
    return emptyExplorer;
  }
  const featureFlags = get(featureFlagsSelector);
  logger.debug("Creating explorer for connection:", {
    connection,
    featureFlags,
  });
  switch (connection.queryEngine) {
    case "openCypher":
      return createOpenCypherExplorer(connection, featureFlags);
    case "sparql":
      return createSparqlExplorer(connection, featureFlags, new Map());
    case "gremlin":
      return createGremlinExplorer(connection, featureFlags);
  }
});

/**
 * Explorer based on the active connection.
 */
export function useExplorer() {
  return useAtomValue(explorerAtom);
}

/** CAUTION: This atom is only for testing purposes. */
export const explorerForTestingAtom = atom<Explorer | null>(null);

/** Sends log entries to the server's same-origin `/logger` endpoint. */
export const serverLogger = new ServerLoggerConnector();
