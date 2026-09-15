import { atom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import type { Explorer } from "@/connector/useGEFetchTypes";

import { emptyExplorer } from "@/connector/emptyExplorer";
import { createGremlinExplorer } from "@/connector/gremlin/gremlinExplorer";
import {
  ClientLoggerConnector,
  type LoggerConnector,
  ServerLoggerConnector,
} from "@/connector/LoggerConnector";
import { createOpenCypherExplorer } from "@/connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "@/connector/sparql/sparqlExplorer";
import { logger } from "@/utils";

import { featureFlagsSelector } from "./StateProvider";
import {
  activeConnectionAtom,
  type NormalizedConnection,
} from "./StateProvider/configuration";

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

export const queryEngineSelector = atom(get =>
  get(
    selectAtom(activeConnectionAtom, c =>
      c && c.queryEngine ? c.queryEngine : "gremlin",
    ),
  ),
);

export function useQueryEngine() {
  return useAtomValue(queryEngineSelector);
}

/**
 * Logger based on the active connection proxy URL.
 */
export const loggerSelector = atom(get =>
  createLoggerFromConnection(get(activeConnectionAtom)),
);

/** Creates a logger instance that sends logs to the server via relative URL. */
export function createLoggerFromConnection(
  connection: NormalizedConnection | null,
): LoggerConnector {
  if (!connection) {
    logger.debug("No connection provided, using a client logger instead");
    return new ClientLoggerConnector();
  }

  return new ServerLoggerConnector();
}
