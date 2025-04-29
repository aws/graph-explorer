import { every, isEqual } from "lodash";
import {
  ClientLoggerConnector,
  LoggerConnector,
  ServerLoggerConnector,
} from "@/connector/LoggerConnector";
import { createGremlinExplorer } from "@/connector/gremlin/gremlinExplorer";
import { createOpenCypherExplorer } from "@/connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "@/connector/sparql/sparqlExplorer";
import { mergedConfigurationSelector } from "./StateProvider/configuration";
import { ConnectionConfig } from "@shared/types";
import { logger } from "@/utils";
import { featureFlagsSelector } from "./featureFlags";
import { Explorer } from "@/connector/useGEFetchTypes";
import { emptyExplorer } from "@/connector/emptyExplorer";
import { atom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

/**
 * Active connection where the value will only change when one of the
 * properties we care about are changed.
 */
const activeConnectionSelector = atom(get => {
  return get(
    selectAtom(
      mergedConfigurationSelector,
      config => config?.connection,
      (latest, prior) => {
        if (Object.is(latest, prior)) {
          return true;
        }
        if (latest == null || prior == null) {
          return false;
        }
        const attrs: (keyof ConnectionConfig)[] = [
          "url",
          "queryEngine",
          "proxyConnection",
          "graphDbUrl",
          "awsAuthEnabled",
          "awsRegion",
          "fetchTimeoutMs",
          "nodeExpansionLimit",
        ];
        return every(attrs, attr =>
          isEqual(latest[attr] as string, prior[attr])
        );
      }
    )
  );
});

const explorerAtom = atom(get => {
  const explorerForTesting = get(explorerForTestingAtom);
  if (explorerForTesting) {
    return explorerForTesting;
  }
  const connection = get(activeConnectionSelector);
  if (!connection) {
    return emptyExplorer;
  }
  const featureFlags = get(featureFlagsSelector);
  logger.debug("Creating explorer for connection:", connection);
  switch (connection.queryEngine) {
    case "openCypher":
      return createOpenCypherExplorer(connection, featureFlags);
    case "sparql":
      return createSparqlExplorer(connection, featureFlags, new Map());
    default:
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
    selectAtom(activeConnectionSelector, c =>
      c && c.queryEngine ? c.queryEngine : "gremlin"
    )
  )
);

export function useQueryEngine() {
  return useAtomValue(queryEngineSelector);
}

/**
 * Logger based on the active connection proxy URL.
 */
export const loggerSelector = atom(get =>
  createLoggerFromConnection(get(activeConnectionSelector))
);

/** Creates a logger instance that will be remote if the connection is using the
 * proxy server. Otherwise it will be a client only logger. */
export function createLoggerFromConnection(
  connection?: ConnectionConfig
): LoggerConnector {
  // Check for a url and that we are using the proxy server
  if (!connection || !connection.url || connection.proxyConnection !== true) {
    logger.debug(
      "Connection did not contain enough information to create a remote logger, so using a client logger instead",
      connection
    );
    return new ClientLoggerConnector();
  }

  logger.debug(
    "Creating a remote server logger using proxy server URL",
    connection.url
  );
  return new ServerLoggerConnector(connection.url);
}
